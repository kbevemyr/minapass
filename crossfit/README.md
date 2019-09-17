# Bastu

Project for remote control of a sauna heater.

The goal of this project is to be able to start and stop a sauna
heater using a browser application, using, for example, a mobile phone
and to read the current temperature to see when it is ready to use.

The solution is built around three main hardware components, 

* a Raspberry PI (version 2)
* one or two 25A 240VAC solid state relays: Crydom D2425 (for one phase) or Crydom D53TP25D (for three phase)
* a I2C - 1wire temperature sensor (Dallas DS18B20)

with a few supporting components detailed below.

The software consists of two parts, one server side that the browser
connects to, and one part that runs on the Raspberry PI. Both parts
are written in Erlang. The client side uses two GPIO pins on the raspberry
to control the relay(s), and one GPIO pin for the i2c protocol communication
with the Dallas DS18B20 temperature sensor.

The client uses a Comet (https://en.wikipedia.org/wiki/Comet_%28programming%29)
request to talk to the server. This allow the server to control the client
even when the server cannot initiate a connection to the client due to it
being located behind a firewall. More on this under the Software section
below.

### Hardware

For hardware we choose the Raspberry PI 2 since it is easy to program
and fairly inexpensive, and also great to experiment with.

To connect the Dallas DS18B20 we need three wires, ground, 3.3v and
GPIO4, and a resistor between 3.3v and the GPIO4 pin.

![DS18B20 4k7](http://www.sbprojects.com/projects/raspberrypi/ds1820connect.png)

The solid state relay is a bit expensive but has the advantage of
being able to handle hight loads while at the same time being
controlled by a low current, just 7 mA, and low voltage (3-32V).

The Raspberry PI can supply a maximum of 16 mA on the GPIO pins,
and outputs 3.3V so it should not be a problem to control the
relays directly from the GPIO pins. However, to be on the safe side
we are using a level shifter that will raise the voltage from 3.3V
to 5V. We use a Texas Instruments 74AHCT125. The max output current
of the 74AHCT125 is 8mA which is enough to drive the D2425 and the
D53TP25D.

#### Connecting to the Sauna Heater

This solution is created for old style sauna heaters with mechanical
controls. Newer, digitally controlled heaters, may require a
different solution.

Heaters come in two setups, those with an external control box,
and those with the controls built into the unit. Most have some
switch that controls a mechanical relay and does not directly
switch the high load circuitry going to the heater. Some have both
an on/off switch and a timer, while some only has a mechanical
timer (egg clock style). For those we can use the D2425, for
setups that have switches that directly controls the three phases
we use the D53TP25D that allows us to switch all three phases.

![D53TP25D](images/d53tp25d_physical.jpeg)

The interals look like this:

![D53TP25D](images/d53tp25d.jpeg)


The idea is to connect our relay in parallel with the switches
in the sauna controller. If there is an on/off switch, we connect
one relay in parallel with that, if there is a timer switch we
connect a relay in parallel with that. When the sauna should be
turned on we activate the relays in tandem, and the same when
turning off the sauna. This means that if the sauna is turned
on using this device, it must be turned off using it as well.
And it also means that the sauna can be controlled using the
original sauna controls as well.

#### Schematics

### Software

The PI runs a version of Linux with Erlang installed and the
erlang_ale library for controlling the hardware. It is set up
to automatically start the sauna software on startup through
the following code in the /etc/rc.local file:

```
(screen -d -m /usr/local/src/gitlab/bastu/pi/bastu/start.sh || true)
```

The server runs inside a screen process which means that it
is possible to log on to the box and inspect the current
state of the server through the Erlang shell.

The software on the PI consists of two parts: 1) [bastu.erl] a
gen-server that controls the sauna through the GPIO pins, and
regularly reads the temperature (every 5 seconds), and 2)
[bastu_comet.erl] a server communication part that connects to the
web-site server and waits for orders to activate/deactivate the sauna,
or to report the current temperature.

The bastu.erl server keeps has the following state


```erlang
-record(state, {
       hw_switch,         %% GPIO pin for controlling the on/off switch on the sauna
       hw_timer,          %% GPIO pin for controlling the timer switch on the sauna
       ref,               %% timer reference for the 3 hour on timer
       temp,              %% current temperature
       status="off",      %% current state on or off
       start_time=gnow()  %% time when the sauna was turned on
      }).

```

```erlang
init([]) ->
    %% initialize state of server loop
    {ok, Gpio10} = gpio:start_link(10, output),
    {ok, Gpio11} = gpio:start_link(11, output),
    gpio:write(Gpio10, 0),
    gpio:write(Gpio11, 0),
    timer:send_after(5000, temp),
    {ok, #state{hw_switch=Gpio10, hw_timer=Gpio11}}.

handle_call(sauna_on, _From, S) ->
    %% turn sauna on
    if S#state.hw_timer == undefined ->
            ok;
       true ->
            timer:cancel(S#state.hw_timer)
    end,
    gpio:write(S#state.hw_switch, 1),
    gpio:write(S#state.hw_timer, 1),
    %% run for three hours
    {ok, Ref} = timer:send_after(3*60*60*1000, sauna_timeout),
    {reply, ok, S#state{ref=Ref, status="on", start_time=gnow()}};
handle_call(sauna_off, _From, S) ->
    %% turn sauna off
    gpio:write(S#state.hw_switch, 0),
    gpio:write(S#state.hw_timer, 0),
    timer:cancel(S#state.ref),
    {reply, ok, S#state{ref=undefined, status="off"}};
handle_call(get_temp, _From, S) ->
    %% report current temperature of sauna
    {reply, S#state.temp, S};
handle_call(get_status, _From, S) ->
    %% report if the sauna is turned on or off
    {reply, S#state.status, S};
handle_call(get_end_time, _From, S) ->
    %% Report for how much longer the sauna will be on
    Remain = S#state.start_time+3*60*60-gnow(),
    {reply, Remain, S};

handle_info(sauna_timeout, S) ->
    gpip:write(S#state.hw_switch, 0),
    gpio:write(S#state.hw_timer, 0),
    {noreply, S#state{ref=undefined, status="off"}};

handle_info(temp, S) ->
    proc_lib:spawn_link(
      fun() ->
              try
                  Temp = string:strip(
                           os:cmd("/usr/local/src/lightstrip/readtemp.sh"),
                           both, $\n),
                  [_,TempStr|_] = string:tokens(Temp, "="),
                  self() ! {temp, TempStr}
              catch
                  X:Y ->
                      error_logger:format("failed to read temp: ~p:~p\n",
                                          [X,Y]),
                      self() ! {temp, "0"}
              end
      end),
    timer:send_after(5000, temp),
    {noreply, S};
```

The bastu_comet.erl code will send a work request to the server
and ask if the server has anything for it to do. If the server
has, for example, if the sauna web page is open and is requesting
the current temperature, then it will receive a work request for
the current temperature. It will then call the server above with
a get_temp request, and report back the result with a reply request
to the server.

This is slightly backwards but gets around the problem of firewalls.
We can assume that the PI is located behind a firewall which means
that the web-server that runs the sauna web page cannot talk directly
with the PI. Instead the PI has to connect to the web server (which
is reachable on the internet) and regularly ask it for work.

It goes like this:

```

PI                                        Web Server                          Browser
==                                        ==========                          =======
GET work -->
         (1 minute delay)
                                      <-- REPLY work:nothing

GET work -->
                                                                             read temp
                                                                         <-- GET temp
                                      <-- REPLY work:get temp
POST reply (23 C) -->
                                                REPLY 23C -->
                                                                             show in browser

                                      <-- REPLY work:nothing
GET work -->  
                                                                             turn on
                                                                         <-- GET turn on
                                      <-- REPLY work:turn on
POST reply (ok) -->
                                                 REPLY ok -->
                                                                             show sauna on
...
```

The bastu_comet.erl code is seen below. It is implemented as an
Erlang gen_server that continously request work from the server,
and perform any work that it gets back.

```erlang
-define(WORK_REQUEST_TTL, 5000).

init([]) ->
    timer:send_after(?WORK_REQUEST_TTL, work_request),
    Id = get_id(),
    {ok, #state{id=Id}}.

handle_info({reply, RId, Res}, State) ->
    %% Reply to previous request, and ask for more work
    %% at the same time
    Json = lists:flatten(json2:encode(to_string(Res))),
    Url = ?PUBSERVER++"/bastu_pub/reply?dev="++State#state.id++"&id="++RId,
    WorkResponse = url:post(Url, Json),
    process_work_response(WorkResponse),
    {noreply, State};

handle_info(work_request, State) ->
    %% Ask for work
    Url = ?PUBSERVER++"/bastu_pub/get-work?dev="++State#state.id,
    WorkResponse = url:get(Url),
    process_work_response(WorkResponse),
    {noreply, State};
```

```erlang
process_work_response(Work) ->
    case Work of
        {200, _Header, Body0} ->
	    Body=lists:flatten(Body0),
            case json2:decode_string(Body) of
                {ok, "nowork"} ->
                    self() ! work_request;
                {ok, {struct, Args}} ->
                    Rpc = get_opt("rpc", Args, "noop"),
                    Id = get_opt("id", Args, "noref"),
                    do_rpc(Rpc, Id);
                Other ->
                    error_logger:format("got error when decoding json: ~p\n",
                                        [Other]),
                    self() ! work_request
            end;
        Error ->
            error_logger:format("got error from server: ~p\n", [Error]),
            %% got an error, wait a short time before we try again
            %% to avoid flooding server with requests
            timer:send_after(?WORK_REQUEST_TTL, work_request),
            ok
    end.

do_rpc(Request, Id) ->
    Res = gen_server:call(bastu, ?l2a(Request)),
    self() ! {reply, Id, Res}.
```

### Installation

### Usage

Create an account at bastu.gt16.se by sending an email jb@bevemyr.com.
The hardware address of the ethernet interface on the PI is used as
device key.
