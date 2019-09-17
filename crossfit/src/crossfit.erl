%    -*- Erlang -*-
%    File:      bastu_pub.erl
%    Author:    Johan Bevemyr
%    Created:   Tue Aug  5 14:29:44 2014
%    Purpose:

-module(crossfit).
-author('jb@bevemyr.com').

-compile(export_all).
%%-export([Function/Arity, ...]).

-include("/usr/lib/yaws/include/yaws_api.hrl").

-behaviour(gen_server).

%% External exports
-export([start/0, stop/0, reset/0, hard_reset/0]).

%% gen_server callbacks
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2,
         code_change/3]).

%% appmod callback
-export([out/1]).

%%
-define(LOGFILE, "/var/log/bastu").

-define(SERVER, ?MODULE).
-define(i2l(X), integer_to_list(X)).
-define(l2i(X), list_to_integer(X)).
-define(l2b(X), list_to_binary(X)).
-define(l2f(X), list_to_float(X)).
-define(b2l(X), binary_to_list(X)).
-define(a2l(X), atom_to_list(X)).
-define(l2a(X), list_to_atom(X)).
-define(t2l(X), tuple_to_list(X)).
-define(l2t(X), list_to_tuple(X)).

-define(stack(), try throw(1) catch _:_ -> erlang:get_stacktrace() end).
-define(liof(Fmt, Args), io:format(user, "~w:~w " ++ Fmt,[?MODULE,?LINE|Args])).
-define(liof_bt(Fmt, Args), io:format(user, "~w:~w ~s ~p\n",
                             [?MODULE, ?LINE,
                              io_lib:format(Fmt, Args), ?stack()])).

-define(EMAIL_SENDER, "info@gt16.se").
-define(MAILSERVER, "mail.bevemyr.com").

-define(USER_DB, "/home/share/jb/work/crossfit/user.db.json").
-define(USER_DB_TMP, "/home/share/jb/work/crossfit/user.db.json.tmp").

-define(LOGIN_URL,
        "http://www.schema.crossfitnorrort.se/schedule/login/"
        "crossfitnorrort/Tr%C3%A4ningspass_CrossFit_Norrort").
-define(BOOK_URL,
        "http://www.schema.crossfitnorrort.se/schedule/crossfitnorrort/"
        "Tr%C3%A4ningspass_CrossFit_Norrort?view=day&day=2&month=9").
-define(CAPACITY_URL,
        "http://www.schema.crossfitnorrort.se/ajax/capacity/60625?token=95389").
-define(TOP_URL,
        "http://www.schema.crossfitnorrort.se/schedule/crossfitnorrort/"
        "Tr%C3%A4ningspass_CrossFit_Norrort").

-define(DAY_SECS, 86400).
-define(BASE_SECS_1970, 62167219200).
-define(BOOK_AHEAD, 10).

%%

-record(post_state, {count=0, acc=[]}).

out(#arg{req = #http_request{method = 'POST'},
         headers = #headers{
           content_type = "multipart/form-data"++_}} = A) ->
    case yaws_api:parse_multipart_post(A) of
        [] ->
            Res = {{struct, [{error, "broken post"}]}, []},
            rpcreply(Res);
        {cont, _, _}
          when is_record(A#arg.state, post_state),
               A#arg.state#post_state.count == 10 ->
            Res = {{struct, [{error, "to big post"}]},[]},
            rpcreply(Res);
        {cont, Cont, Res}  ->
            PState = A#arg.state,
            Count = PState#post_state.count,
            Acc = PState#post_state.acc,
            {get_more, Cont, PState#post_state{count=Count+1,acc=[Acc|Res]}};
        {result, Res} ->
            PState = A#arg.state,
            Acc = PState#post_state.acc,
            PostStr = skip_ws(dequote(?b2l(?l2b([Acc|Res])))),
            case json2:decode_string(PostStr) of
                {ok, Json} ->
                    L = yaws_api:parse_query(A),
                    do_op(A#arg.appmoddata, L, Json, A);
                _Reason ->
                    Res = {{struct, [{error,"invalid json"}]}, []},
                    rpcreply(Res)
            end
    end;
out(#arg{req = #http_request{method = 'POST'},
         headers = #headers{
           content_type = "application/x-www-form-urlencoded"++_}} = A) ->
    Clidata = ?b2l(A#arg.clidata),
    DecodedClidata = yaws_api:url_decode(Clidata),
    L = yaws_api:parse_query(A),
    %% io:format("got appmod request: ~p\n", [A#arg.appmoddata]),
    case json2:decode_string(dequote(DecodedClidata)) of
        {ok, Json} ->
            do_op(A#arg.appmoddata, L, Json, A);
        _Reason ->
            io:format("json=~p\n", [DecodedClidata]),
            io:format("got error ~p\n", [_Reason]),
            Res = {{struct, [{error,"invalid json"}]}, []},
            rpcreply(Res)
    end;
out(#arg{req = #http_request{method = 'POST'}} = A) ->
    case A#arg.clidata of
        {partial, Data} when A#arg.cont =:= undefined ->
            %% first chunk
            {get_more, {cont, size(Data)},
             #post_state{count=size(Data), acc=[Data]}};
        {partial, Data} ->
            {cont, Sz0} = A#arg.cont,
            PState = A#arg.state,
            Acc = PState#post_state.acc,
            {get_more, {cont, Sz0+size(Data)},
             PState#post_state{
               count=PState#post_state.count+size(Data),
               acc = [Acc|Data]}};
        Data ->
            if A#arg.state == undefined ->
                    Clidata = ?b2l(Data);
               true ->
                    PState = A#arg.state,
                    Acc = PState#post_state.acc,
                    Clidata = ?b2l(?l2b([Acc|Data]))
            end,
            L = yaws_api:parse_query(A),
            case json2:decode_string(dequote(Clidata)) of
                {ok, Json} ->
                    do_op(A#arg.appmoddata, L, Json, A);
                _Reason ->
                    ?liof("json=~p\n", [Clidata]),
                    ?liof("got error ~p\n", [_Reason]),
                    Res = {{struct, [{error, "invalid json"}]}, []},
                    rpcreply(Res)
            end
    end;
out(A) ->
    QueryL = yaws_api:parse_query(A),
    L = case (A#arg.req)#http_request.method of
            'GET' ->
                QueryL;
            'POST' ->
                io:format("post=~p\n", [yaws_api:parse_post(A)]),
                QueryL ++ yaws_api:parse_post(A)
        end,
    %% io:format("got appmod request: ~p\n", [A#arg.appmoddata]),
    do_op(A#arg.appmoddata, L, [], A).

do_op(Cmd, L, Json, Arg) ->
    try
        Res = gen_server:call(?SERVER, {Cmd, L, Json, Arg}, infinity),
        rpcreply(Res)
    catch
        X:Y ->
            error_logger:format("crashed for ~p:~p:~p\n~p:~p\n~p\n",
                                [Cmd, L, Json, X, Y, erlang:get_stacktrace()]),
            Res2 = {struct, [{error, "internal error"}]},
            rpcreply(Res2)
    end.

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%% Gen server

-record(workout, {
          date,
          day_of_week,
          start,
          stop,
          id,
          seats,
          reserved,
          type,
          coach,
          description,
          queue
         }).

-record(user, {
          username = [],          %% string() - username (email addess)
          password = [],          %% string() - password MD5
          sid = [],               %% string() - session id
          confirmed = false,      %% boolean() - confirmed
          role = user,            %% admin | user - privilege group
          passwd_reset_id = [],   %% string() - password reset id
          passwd_reset_send_time=0, %% date_time() - send time time of last
                                    %% password reset email
          comment=[],             %% info on reverse ssh port, for example
          bookinguser=[],
          bookingpass=[],
          bookingname=[],
          bookingfull=[],
          plan=[],                %% [{Weekday, Time, Type}]
          booked=[]
         }).

-record(user_type, {
          username = string,
          password = string,
          sid = string,
          confirmed = boolean,
          role = atom,
          passwd_reset_id = string,
          passwd_reset_send_time=integer,
          comment=string,
          bookinguser=string,
          bookingpass=string,
          bookingname=string,
          bookingfull=string,
          plan=list,
          booked=list
         }).

-record(date, {
          year,
          month,
          day
         }).

-record(date_type, {
          year = integer,
          month = integer,
          day = integer
         }).

-record(booked, {
          date,  %% #date{}
          time   %% "HH:MM"
         }).

-record(booked_type, {
          date = record,  %% #date{}
          time = string   %% "HH:MM"
         }).

-record(plan, {
          day,    %% "monday"|"tuesday"|"wednesday"|"thrusday"|"firday"|"saturday"|"sunday"
          time,   %% "HH:MM"
          type    %% coach | keycard
         }).

-record(plan_type, {
          day = atom,
          time = string,
          type = atom
         }).

-record(state, {
          users=[],
          last_applied
         }).

%%%----------------------------------------------------------------------
%%% API
%%%----------------------------------------------------------------------
start() ->
    gen_server:start({local, ?SERVER}, ?MODULE, [], []).

stop() ->
    gen_server:call(?SERVER, stop, infinity).

reset() ->
    gen_server:call(?SERVER, reset, infinity).

hard_reset() ->
    gen_server:call(?SERVER, hard_reset, infinity).

%%%----------------------------------------------------------------------
%%% Callback functions from gen_server
%%%----------------------------------------------------------------------

%%----------------------------------------------------------------------
%% Func: init/1
%% Returns: {ok, State}          |
%%          {ok, State, Timeout} |
%%          ignore               |
%%          {stop, Reason}
%%----------------------------------------------------------------------
init([]) ->
    {X,Y,Z} = erlang:now(),
    random:seed(X, Y, Z),
    Date = date(),
    Users = process(),
    timer:send_after(60*60*1000, process), %% every hour
    {ok, #state{users=Users, last_applied=Date}}.

%%----------------------------------------------------------------------
%% Func: handle_call/3
%% Returns: {reply, Reply, State}          |
%%          {reply, Reply, State, Timeout} |
%%          {noreply, State}               |
%%          {noreply, State, Timeout}      |
%%          {stop, Reason, Reply, State}   | (terminate/2 is called)
%%          {stop, Reason, State}            (terminate/2 is called)
%%----------------------------------------------------------------------
handle_call(hard_reset, _From, S) ->
    file:copy(?USER_DB++".start", ?USER_DB),
    Users = read_users(),
    {reply, ok, S#state{users=Users}};

handle_call(reload, _From, S) ->
    Users = read_users(),
    {reply, ok, S#state{users=Users}};

handle_call(stop, _From, S) ->
    {stop, normal, S};

handle_call({Cmd, L, Json, Arg}, From, S) ->
    try
        %% ?liof("Json=~p\n", [Json]),
        do_cmd(Cmd, L, Json, Arg, From, S)
    catch
        X:Y ->
            error_logger:format(
              "error during exection of cmd ~p: ~p ~p\n",
              [{Cmd, L, Json}, {X,Y}, erlang:get_stacktrace()]),
            {reply, {struct, [{error, "internal"}]}, S}
    end;

handle_call(_Request, _From, S) ->
    Res = {struct, [{error, "unknown request"}]},
    {reply, Res, S}.

%%----------------------------------------------------------------------
%% Func: handle_cast/2
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%%----------------------------------------------------------------------
handle_cast(_Msg, State) ->
    {noreply, State}.

%%----------------------------------------------------------------------
%% Func: handle_info/2
%% Returns: {noreply, State}          |
%%          {noreply, State, Timeout} |
%%          {stop, Reason, State}            (terminate/2 is called)
%%----------------------------------------------------------------------
handle_info(process, State) ->
    Date = date(),
    case State#state.last_applied of
        Date ->
            NewUsers = State#state.users,
            do_nothing;
        _NewDay ->
            NewUsers = process(State#state.users)
    end,
    timer:send_after(60*60*1000, process), %% every hour
    {noreply, State#state{last_applied=Date, users=NewUsers}};
handle_info(_Info, State) ->
    {noreply, State}.

%%----------------------------------------------------------------------
%% Func: terminate/2
%% Purpose: Shutdown the server
%% Returns: any (ignored by gen_server)
%%----------------------------------------------------------------------
terminate(_Reason, _State) ->
    ok.

code_change(_OldVsn, S, _Extra) ->
    {ok, S}.

%%%----------------------------------------------------------------------
%%% Internal functions
%%%----------------------------------------------------------------------

%% http://crossfit.bevemyr.com/crossfit/login?user=johan&password=test
do_cmd("login", L, _Json, _A, _From, S) ->
    User = get_val("user", L, ""),
    Password = get_val("password", L, ""),
    Remember = get_val("remember", L, "false"),
    Md5Pass = encode_pass(Password),
    case get_user_by_name(User, S) of
        U=#user{password = Md5Pass} when Remember == "true" ->
            %% login successful
            {Y,M,D} = date(),
            Expires= format_expires_date({{Y+1,M,D},time()}),
            Headers=[yaws_api:setcookie("sid", U#user.sid, "/", Expires)],
            Res = {struct, [{"sid", U#user.sid},
                            {group, ?a2l(U#user.role)}]};
        U=#user{password = Md5Pass} ->
            %% login successful
            Headers=[yaws_api:setcookie("sid", U#user.sid, "/")],
            Res = {struct, [{"sid", U#user.sid},
                            {group, ?a2l(U#user.role)}]};
        #user{} ->
            Headers=[],
            Res = {struct, [{error, "invalid password"}]};
        _ ->
            Headers=[],
            Res = {struct, [{error, "unknown user"}]}
    end,
    {reply, {Res,Headers}, S};

%% http://crossfit.bevemyr.com/crossfit/send_reset_password?user=johan
do_cmd("send_reset_password", L, _Json, _A, _From, S) ->
    User = get_val("user", L, ""),
    case get_user_by_name(User, S) of
        U=#user{} ->
            RPid = mk_rpid(S),
            smtp:send(?MAILSERVER, ?EMAIL_SENDER, [User],
                      "Password reset request",
                      "You have requested a password reset. Follow the link\n"
                      "below to reset the password. Ignore this email if you "
                      "haven't\n"
                      "requested a reset.",
                      "http://crossfit.bevemyr.com/reset_password.html?rpid="++RPid,
                      []),
            %% Note that the reset_password.html page should make a AJAX call to
            %% the reset_password?rpdi=<rpid from post to .html
            %% page>&password=<new password>
            Res = {struct, [{state, "ok"}]},
            NewUser = U#user{passwd_reset_id=RPid,
                             passwd_reset_send_time=gnow()},
            NewUsers = update_user(NewUser, S#state.users),
            NewS = S#state{users=NewUsers};
        _ ->
            Res = {struct, [{state, "error"}, {reason, "unknown user"}]},
            NewS = S
    end,
    {reply, {Res,[]}, NewS};

%% http://crossfit.bevemyr.com/crossfit/reset_password?rpid=1234567890&password=test
do_cmd("reset_password", L, _Json, _A, _From, S) ->
    Rpid = get_val("rpid", L, ""),
    Password = get_val("password", L, ""),
    case get_user_by_rpid(Rpid, S) of
        U=#user{} ->
            Age = days_diff(U#user.passwd_reset_send_time, gnow()),
            if Age < 5 ->
                    %% login successful
                    Md5Pass = ?b2l(base64:encode(crypto:hash(md5, Password))),
                    NewU = U#user{password=Md5Pass},
                    Res = {struct, [{user, user2object(U)}]},
                    {{Res,[]}, S#state{users=update_user(NewU, S#state.users)}};
               true ->
                    Res = {struct,
                           [{error, "password reset link has expired"}]},
                    {reply, {Res, []}, S}
            end;
        _ ->
            Res = {struct, [{error, "unknown sid"}]},
            {reply, {Res, []}, S}
    end;

%% http://crossfit.bevemyr.com/crossfit/set_password?old_password=test&new_password=test2
do_cmd("set_password", L, _Json, A, _From, S) ->
    Sid = get_sid(A,L),
    OldPass = get_val("old_password", L, ""),
    NewPass = get_val("new_password", L, ""),
    Md5OldPass = ?b2l(base64:encode(crypto:hash(md5, OldPass))),
    Md5NewPass = ?b2l(base64:encode(crypto:hash(md5, NewPass))),
    case get_user_by_id(Sid, S) of
        U=#user{} when Md5OldPass == U#user.password ->
            %% successful auth of old pass
            NewU = U#user{password=Md5NewPass},
            Res = {struct, [{status, "ok"}]},
            {reply, {Res,[]}, S#state{users=update_user(NewU, S#state.users)}};
        _ ->
            Res = {struct, [{error, "unknown sid"}]},
            {reply, {Res, []}, S}
    end;

%% http://crossfit.bevemyr.com/crossfit/set_user_password?username=jb&password=test
do_cmd("set_user_password", L, _Json, A, _From, S) ->
    Sid = get_sid(A,L),
    Username = get_val("username", L, ""),
    NewPass = get_val("new_password", L, ""),
    Md5NewPass = ?b2l(base64:encode(crypto:hash(md5, NewPass))),
    case get_user_by_id(Sid, S) of
        U=#user{} when U#user.role == admin ->
            case get_user_by_name(Username, S) of
                OU=#user{} ->
                    NewU = OU#user{password=Md5NewPass},
                    Res = {struct, [{status, "ok"}]},
                    NewS = S#state{users=update_user(NewU, S#state.users)},
                    {reply, {Res, []}, NewS};
                false ->
                    Res = {struct, [{error, "unknown user"}]},
                    {reply, {Res, []}, S}
            end;
        U=#user{} when U#user.username == Username ->
            NewU = U#user{password=Md5NewPass},
            Res = {struct, [{status, "ok"}]},
            NewS = S#state{users=update_user(NewU, S#state.users)},
            {reply, {Res, []}, NewS};
        #user{} ->
            Res = {struct, [{error, "only allowed for admin user"}]},
            {reply, {Res,[]}, S};
        _ ->
            Res = {struct, [{error,"unknown sid"}]},
            {reply, {Res,[]}, S}
    end;

%% http://crossfit.bevemyr.com/crossfit/get_all_users
do_cmd("get_all_users", L, _Json, A, _From, S) ->
    Sid = get_sid(A,L),
    case get_user_by_id(Sid, S) of
        User=#user{} when User#user.role == admin ->
            %% login successful
            Res = {array, [user2object(U) || U <- S#state.users]};
        User=#user{} ->
            %% login successful
            Res = {array, [user2object(User)]};
        _ ->
            Res = {struct, [{error,"unknown sid"}]}
    end,
    {reply, {Res,[]}, S};

%% http://crossfit.bevemyr.com/crossfit/get_user
do_cmd("get_user", L, _Json, A, _From, S) ->
    Sid = get_sid(A,L),
    case get_user_by_id(Sid, S) of
        U=#user{} ->
            %% login successful
            Res = user2object(U);
        _ ->
            Res = {struct, [{error,"unknown sid"}]}
    end,
    {reply, {Res, []}, S};

%% http://crossfit.bevemyr.com/crossfit/book_user?sid=1234567890
do_cmd("book_user", L, _Json, A, _From, S) ->
    Sid = get_sid(A,L),
    case get_user_by_id(Sid, S) of
        U=#user{} ->
            %% login successful
            NewU = process_user(U),
            Res = user2object(U),
            NewUsers = update_user(NewU, S#state.users);
        _ ->
            Res = {struct, [{error,"unknown sid"}]},
            NewUsers = S#state.users
    end,
    {reply, {Res, []}, S#state{users=NewUsers}};

%% http://crossfit.bevemyr.com/crossfit/verify_user_credentials?sid=1234567890
do_cmd("verify_user_credentials", L, _Json, A, _From, S) ->
    Sid = get_sid(A,L),
    case get_user_by_id(Sid, S) of
        U=#user{} ->
            %% login successful
            case login_user(U) of
                failed ->
                    Res = {struct, [{status, "error"},
                                    {error, "failed to login to booking site"}]};
                _Cookies ->
                    Res = {struct, [{status, "ok"}]}
            end;
        _ ->
            Res = {struct, [{error,"unknown sid"}]}
    end,
    {reply, {Res, []}, S};

%% http://crossfit.bevemyr.com/crossfit/get_named_user?username=jb
do_cmd("get_named_user", L, _Json, A, _From, S) ->
    Sid = get_sid(A,L),
    case get_user_by_id(Sid, S) of
        U=#user{} when U#user.role == admin ->
            Username = get_val("username", L, ""),
            case get_user_by_name(Username, S) of
                OU=#user{} ->
                    Res = user2object(OU);
                false ->
                    Res = {struct, [{error, "unknown user"}]}
            end;
        #user{} ->
            Res = {struct, [{error, "only allowed for admin user"}]};
        _ ->
            Res = {struct, [{error, "unknown sid"}]}
    end,
    {reply, {Res,[]}, S};

%% http://crossfit.bevemyr.com/crossfit/set_user
do_cmd("set_user", L, Json, A, _From, S) ->
    Sid = get_sid(A,L),
    case get_user_by_id(Sid, S) of
        U=#user{} ->
            %% login successful
            U2 = apply_user_ops(U,L,U),
            U3 = json2val(Json),
            NewU = merge_user(U2, U3),
            Res = {struct, [{status, "ok"}]},
            {reply, {Res,[]}, S#state{users=update_user(NewU, S#state.users)}};
        _ ->
            Res = {struct, [{error, "unknown sid"}]},
            {reply, {Res, []}, S}
    end;

%% http://crossfit.bevemyr.com/crossfit/set_user?username=bar
do_cmd("set_named_user", L, Json, A, _From, S) ->
    Sid = get_sid(A,L),
    Username = get_val("username", L, ""),
    case get_user_by_id(Sid, S) of
        U=#user{} when U#user.role == admin ->
            case get_user_by_name(Username, S) of
                OU=#user{} ->
                    case json2val(Json) of
                        U3 = #user{} ->
                            NewU = merge_user_admin(OU, U3),
                            Res = {struct, [{status, "ok"}]},
                            NewS = S#state{users=update_user(NewU, S#state.users)};
                        _ ->
                            NewS = S,
                            Res = {struct, [{error, "malformed user"}]}
                    end;
                false ->
                    NewS = S,
                    Res = {struct, [{error, "unknown user"}]}
            end;
        U=#user{} when U#user.username == Username ->
            U2 = apply_user_ops(U,L,U),
            U3 = json2val(Json),
            NewU = merge_user(U2, U3),
            Res = {struct, [{status, "ok"}]},
            NewS = S#state{users=update_user(NewU, S#state.users)};
        #user{} ->
            NewS = S,
            Res = {struct, [{error, "only allowed for admin user"}]};
        _ ->
            NewS = S,
            Res = {struct, [{error, "unknown sid"}]}
    end,
    {reply, {Res, []}, NewS};

%% http://crossfit.bevemyr.com/crossfit/add_user?username=jb&
%% password=test&role=user&foo=bar
do_cmd("add_user", L0, Json, A, _From, S) ->
    Sid = get_sid(A, L0),
    L = merge_attrs(L0, Json),
    case get_user_by_id(Sid, S) of
        U=#user{} when U#user.role == admin ->
            %% login successful
            Username = get_val("username", L, ""),
            Password = get_val("password", L, ""),
            Role = get_val("role", L, ""),
            Exists = get_user_by_name(Username, S) =/= false,
            if Username == "" ->
                    NewS = S,
                    Res = {struct, [{error, "invalid username"}]};
               Password == "" ->
                    NewS = S,
                    Res = {struct, [{error, "invalid password"}]};
               Exists ->
                    NewS = S,
                    Res = {struct, [{error, "a user with the same name "
                                     "already exists"}]};
               true ->
                    Md5Pass = ?b2l(base64:encode(crypto:hash(md5, Password))),
                    U2 = #user{username=Username,
                               password=Md5Pass,
                               sid=mk_id(S),
                               role=?l2a(Role)},
                    U3 = json2val(Json),
                    NewU = merge_user(U2, U3),
                    store_users([NewU|S#state.users]),
                    Res = {struct, [{status, "ok"}]},
                    NewS = S#state{users=[NewU|S#state.users]}
            end;
        #user{} ->
            %% login successful
            NewS = S,
            Res = {struct, [{error, "only admin can create users"}]};
        _ ->
            NewS = S,
            Res = {struct, [{error, "unknown sid"}]}
    end,
    ?liof("Res=~p\n", [Res]),
    {reply, {Res, []}, NewS};

%% http://crossfit.bevemyr.com/crossfit/del_user?username=jb
do_cmd("del_user", L, _Json, A, _From, S) ->
    Sid = get_sid(A,L),
    Username = get_val("username", L, ""),
    case get_user_by_id(Sid, S) of
        U=#user{} when U#user.role == admin ->
            DelUser = get_user_by_name(Username, S),
            if Username == "" ->
                    NewS = S,
                    Res = {struct, [{error, "invalid username"}]};
               DelUser == false ->
                    NewS = S,
                    Res = {struct, [{error, "the user does not exist"}]};
               true ->
                    NewUsers = lists:delete(DelUser, S#state.users),
                    store_users(NewUsers),
                    Res = {struct, [{status, "ok"}]},
                    NewS = S#state{users=NewUsers}
            end;
        U=#user{} when U#user.username == Username ->
            NewUsers = lists:delete(U, S#state.users),
            store_users(NewUsers),
            Res = {struct, [{status, "ok"}]},
            NewS = S#state{users=NewUsers};
        #user{} ->
            %% login successful
            NewS = S,
            Res = {struct, [{error, "only admin can remove users"}]};
        _ ->
            NewS = S,
            Res = {struct, [{error, "unknown sid"}]}
    end,
    {reply, {Res, []}, NewS};

do_cmd(Unknown, _L, _Json, _Arg, _From, S) ->
    Error = lists:flatten(io_lib:format("unknown request: ~p", [Unknown])),
    error_logger:format("~s", [Error]),
    {reply, {{struct, [{error, Error}]}, []}, S}.

rpcreply({Response, ExtraHeaders}) ->
    X = json2:encode(Response),
    [{header, {cache_control, "no-cache"}},
     {header, "Access-Control-Allow-Origin: *"},
     {header, "Expires: -1"}]++ExtraHeaders++[{html, X}].

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

merge_attrs(L, {struct, Ops}) ->
    L ++ Ops;
merge_attrs(L, _Json) ->
    L.

date2gdate(YMD) ->
    calendar:datetime_to_gregorian_seconds({YMD, {0,0,0}}).

days_diff(A, B) when is_integer(A), is_integer(B) ->
    DiffSecs = A - B,
    DiffSecs div 86400;
days_diff(A, B) when is_tuple(A), is_tuple(B) ->
    days_diff(date2gdate(A), date2gdate(B)).

%%

get_val(Key, L, Default) ->
    case lists:keysearch(Key, 1, L) of
        {value, {_, undefined}} -> Default;
        {value, {_, Val}} -> Val;
        _ -> Default
    end.


to_int(Str) ->
    case catch ?l2i(Str) of
        I when is_integer(I) ->
            I;
        _ ->
            -1
    end.

dequote([]) -> [];
dequote([$\\, $t|Rest]) -> [$\t|dequote(Rest)];
dequote([$\\, $n|Rest]) -> [$\t|dequote(Rest)];
dequote([$\\, $r|Rest]) -> [$\t|dequote(Rest)];
dequote([C|Rest]) -> [C|dequote(Rest)].

skip_ws([$\t|Rest]) -> skip_ws(Rest);
skip_ws([$\n|Rest]) -> skip_ws(Rest);
skip_ws([$\r|Rest]) -> skip_ws(Rest);
skip_ws([$ |Rest]) -> skip_ws(Rest);
skip_ws(Rest) -> Rest.

to_string(A) when is_atom(A) ->
    atom_to_list(A);
to_string(L) when is_list(L) ->
    L;
to_string(T) ->
    io_lib:format("~p", [T]).



get_sid(A, L) ->
    case get_val("sid", L, "") of
        "" ->
            get_cookie_val("sid", A);
        Sid ->
            Sid
    end.

get_cookie_val(Cookie, Arg) ->
    H = Arg#arg.headers,
    yaws_api:find_cookie_val(Cookie, H#headers.cookie).


get_user_by_id(User, S) ->
    case lists:keysearch(User, #user.sid, S#state.users) of
        {value, U=#user{}} ->
            U;
        false ->
            false
    end.

get_user_by_name(User, S) ->
    case lists:keysearch(User, #user.username, S#state.users) of
        {value, U=#user{}} ->
            U;
        false ->
            false
    end.

format_expires_date({{Year, Month, Date}, {Hours, Minutes, Seconds}}) ->
    lists:flatten(
      io_lib:format("~s, ~p ~s ~p ~2.2.0w:~2.2.0w:~2.2.0w GMT",
                    [weekday({Year, Month, Date}), Date,
                     month(Month), Year, Hours, Minutes, Seconds])).

weekday(Date) ->
    int_to_wd(calendar:day_of_the_week(Date)).

int_to_wd(1) ->
    "Mon";
int_to_wd(2) ->
    "Tue";
int_to_wd(3) ->
    "Wed";
int_to_wd(4) ->
    "Thu";
int_to_wd(5) ->
    "Fri";
int_to_wd(6) ->
    "Sat";
int_to_wd(7) ->
    "Sun".

month(1) ->
    "Jan";
month(2) ->
    "Feb";
month(3) ->
    "Mar";
month(4) ->
    "Apr";
month(5) ->
    "May";
month(6) ->
    "Jun";
month(7) ->
    "Jul";
month(8) ->
    "Aug";
month(9) ->
    "Sep";
month(10) ->
    "Oct";
month(11) ->
    "Nov";
month(12) ->
    "Dec".

mk_id(S) ->
    N = random:uniform(16#ffffffffffffffff), %% 64 bits
    Id = ?i2l(N),
    case lists:keysearch(Id, #user.sid, S#state.users) of
        {value, _} ->
            mk_id(S);
        _ ->
            Id
    end.

mk_rpid(S) ->
    N = random:uniform(16#ffffffffffffffff), %% 64 bits
    Id = ?i2l(N),
    case lists:keysearch(Id, #user.passwd_reset_id, S#state.users) of
        {value, _} ->
            mk_rpid(S);
        _ ->
            Id
    end.

update_user(User, Users) ->
    NewUsers = lists:keyreplace(User#user.username,
                                #user.username, Users, User),
    store_users(NewUsers),
    NewUsers.

get_user_by_rpid(PRID, S) ->
    case lists:keysearch(PRID, #user.passwd_reset_id, S#state.users) of
        {value, U=#user{}} ->
            U;
        false ->
            false
    end.

merge_user(Uold=#user{}, Unew=#user{}) ->
    Uold#user{comment     = Unew#user.comment,
              bookinguser = Unew#user.bookinguser,
              bookingpass = Unew#user.bookingpass,
              bookingname = Unew#user.bookingname,
              bookingfull = Unew#user.bookingfull,
              plan        = Unew#user.plan,
              booked      = Unew#user.booked}.

merge_user_admin(Uold=#user{}, Unew=#user{}) ->
    Uold#user{role        = Unew#user.role,
              comment     = Unew#user.comment,
              bookinguser = Unew#user.bookinguser,
              bookingpass = Unew#user.bookingpass,
              bookingname = Unew#user.bookingname,
              bookingfull = Unew#user.bookingfull,
              plan        = Unew#user.plan,
              booked      = Unew#user.booked}.

apply_user_ops(U, [], _AUser) ->
    U;
apply_user_ops(U, [{"sid", _}|Ops], AUser) ->
    apply_user_ops(U, Ops, AUser);
apply_user_ops(U, [{"password", _}|Ops], AUser) ->
    apply_user_ops(U, Ops, AUser);
apply_user_ops(U, [{"username", _}|Ops], AUser) ->
    apply_user_ops(U, Ops, AUser);
apply_user_ops(U, [{"passwd_reset_id", _}|Ops], AUser) ->
    apply_user_ops(U, Ops, AUser);
apply_user_ops(U, [{"passwd_reset_send_time", _}|Ops], AU) ->
    apply_user_ops(U, Ops, AU);
apply_user_ops(U, [{"comment", Dev}|Ops], AU) ->
    apply_user_ops(U#user{comment=Dev}, Ops, AU);
apply_user_ops(U, [{"bookinguser", Dev}|Ops], AU) ->
    apply_user_ops(U#user{bookinguser=Dev}, Ops, AU);
apply_user_ops(U, [{"bookingpass", Dev}|Ops], AU) ->
    apply_user_ops(U#user{bookingpass=Dev}, Ops, AU);
apply_user_ops(U, [{"bookingname", Dev}|Ops], AU) ->
    apply_user_ops(U#user{bookingname=Dev}, Ops, AU);
apply_user_ops(U, [{"bookingfull", Dev}|Ops], AU) ->
    apply_user_ops(U#user{bookingfull=Dev}, Ops, AU);
apply_user_ops(U, [{"role", NewRole}|Ops], AU) ->
    if AU#user.role == admin ->
            apply_user_ops(U#user{role=?l2a(NewRole)}, Ops, AU);
       true ->
            apply_user_ops(U, Ops, AU)
    end;
apply_user_ops(U, [_|Ops], AU) ->
    apply_user_ops(U, Ops, AU).

%

encode_pass(Password) ->
    ?b2l(base64:encode(crypto:hash(md5, Password))).

log(Msg, Arg, Params) ->
    try
        IpPort = io_lib:format("~p", [Arg#arg.client_ip_port]),
        Entry = [gtostr(gnow()), " - ", Msg, " - ", IpPort, " for ",
                 io_lib:format("~p", [Params]),"\n"],
        file:write_file(?LOGFILE, Entry, [append])
    catch
        X:Y ->
            error_logger:format("failed to log: ~p:~p\n", [X,Y])
    end.

%% 

process() ->
    Users = read_users(),
    process(Users).

process(Users) ->
    ?liof("re-process ~p\n", [Users]),
    NewUsers = [process_user(User) || User <- Users],
    store_users(NewUsers),
    NewUsers.

login(User, Password) ->
    case url:get(?LOGIN_URL++"?after=%2Fschedule%2Fcrossfitnorrort%2FTr%25C3%25A4") of
        {_Status1, Headers1, _Body1} ->
            %% ?liof("Status1=~p\n", [Status1]),
            %% ?liof("Headers1=~p\n", [Headers1]),
            %% ?liof("Body1=~s\n", [Body1]),
            Cookies1 = url:update_cookies([], Headers1);
        Other1 ->
            ?liof("login failed: ~p\n", [Other1]),
            Cookies1 = []
    end,
    case url:post_dict(?LOGIN_URL, [{"name", User},{"password",Password},
                                    {"remember","K"}], Cookies1,  []) of
        {_Status, Headers, _Body} ->
            %% ?liof("Status=~p\n", [_Status]),
            %% ?liof("Headers=~p\n", [Headers]),
            %% ?liof("Body=~s\n", [Body]),
            Cookies2 = url:update_cookies(Cookies1, Headers);
        Other ->
            ?liof("login failed: ~p\n", [Other]),
            Cookies2 = Cookies1
    end,
    case url:get_with_cookies(?TOP_URL, Cookies2) of
        {_Status2, Headers2, Body2} ->
            %% ?liof("Status=~p\n", [Status2]),
            %% ?liof("Headers=~p\n", [Headers2]),
            case string:str(lists:flatten(Body2), "Inloggad som") of
                0 ->
                    ?liof("failed: ~p\n", [Body2]),
                    failed;
                _ ->
                    Cookies3 = url:update_cookies(Cookies2, Headers2),
                    Cookies3
            end;
        Other2 ->
            ?liof("login failed: ~p\n", [Other2]),
            failed
    end.
        
get_day(GSecs) when is_integer(GSecs) ->
    From = gtostr(GSecs, date),
    To = gtostr(GSecs+?DAY_SECS, date),
    case capacity(From, To) of
        {ok, {struct, [_Ato, _Afrom, {"app", {array, Workout}}]}} ->
            objects2workout(Workout, []);
        Other ->
            ?liof("Other=~p\n", [Other]),
            {error, Other}
    end;
get_day({Year, Month, Day}) ->
    GSecs = calendar:datetime_to_gregorian_seconds(
              {{Year,Month,Day},{0,0,0}}),
    get_day(GSecs);
get_day(DayStr) ->
    [Year, Month, Day] = string:tokens(DayStr, "-"),
    GSecs = calendar:datetime_to_gregorian_seconds(
              {{?l2i(Year),?l2i(Month),?l2i(Day)},{0,0,0}}),
    get_day(GSecs).

capacity(AFrom, ATo) ->
    Url = lists:flatten([?CAPACITY_URL,
                        "&afrom=",AFrom,"&ato=",ATo,
                        "&ed=r"]),
    case url:get(Url) of
        {_Status, _Headers, Body} ->
            %% ?liof("Status=~p\n", [_Status]),
            %% ?liof("Body=~s\n", [Body]),
            json2:decode_string(lists:flatten(Body));
        Other ->
            ?liof("login failed: ~p\n", [Other]),
            Other
    end.
        
book(FullName, Name, SlotId, Cookies) ->
    Url = ?BOOK_URL,
    case url:post_dict(Url, [{"utf8","v"},
                             {"booking[full_name]", FullName},
                             {"booking[field_2]", Name},
                             {"booking[confirm]", "0"},
                             {"booking[slot_id]", ?i2l(SlotId)},
                             {"button",""},
                             {"booking[xpos]","1044"},
                             {"booking[ypos]","1368"}
                             ], Cookies, []) of
        {_Status, Headers, Body0} ->
            %% ?liof("Status=~p\n", [Status]),
            %% ?liof("Body=~s\n", [Body0]),
            NewCookies = url:update_cookies(Cookies, Headers),
            Body = lists:flatten(Body0),
            case string:str(Body, "Endast en reservation") of
                0 ->
                    case string:str(Body, "<div id=\"booking_error\"></div>") of
                        0 ->
                            {error, unknown};
                        _ ->
                            {NewCookies, Body}
                    end;
                _N ->
                    {error, already_booked}
            end;
        Other ->
            ?liof("booking failed: ~p\n", [Other]),
            {error, Other}
    end.
                         
%% Time management

gnow() -> calendar:datetime_to_gregorian_seconds(calendar:local_time()).

gtostr(Secs) -> gtostr(Secs, date_time).

gtostr(undefined, _) -> "-";
gtostr(Secs, date) ->
    {{Year, Month, Day}, _} = calendar:gregorian_seconds_to_datetime(Secs),
    lists:flatten(io_lib:format("~w-~2.2.0w-~2.2.0w", [Year, Month, Day]));
gtostr(Secs, day_of_week) ->
    {{Year, Month, Day}, _} = calendar:gregorian_seconds_to_datetime(Secs),
    DayOfWeek = calendar:day_of_the_week(Year, Month, Day),
    day_of_week(DayOfWeek);
gtostr(Secs, time) ->
    {_, {Hour, Minute, Second}} = calendar:gregorian_seconds_to_datetime(Secs),
    lists:flatten(io_lib:format("~2.2.0w:~2.2.0w:~2.2.0w",
                                [Hour, Minute, Second]));
gtostr(Secs, time24hm) ->
    {_, {Hour, Minute, _Sec}} = calendar:gregorian_seconds_to_datetime(Secs),
    lists:flatten(io_lib:format("~2.2.0w:~2.2.0w", [Hour, Minute]));
gtostr(Secs, date_time) ->
    {{Year, Month, Day}, {Hour, Minute, Second}} =
        calendar:gregorian_seconds_to_datetime(Secs),
    lists:flatten(io_lib:format("~w-~2.2.0w-~2.2.0w ~2.2.0w:~2.2.0w:~2.2.0w",
                                [Year, Month, Day, Hour, Minute, Second]));
gtostr(Secs, date_time_nospace) ->
    {{Year, Month, Day}, {Hour, Minute, Second}} =
        calendar:gregorian_seconds_to_datetime(Secs),
    lists:flatten(io_lib:format("~w-~2.2.0w-~2.2.0w_~2.2.0w:~2.2.0w:~2.2.0w",
                                [Year, Month, Day, Hour, Minute, Second])).

day_of_week(1) ->
    monday;
day_of_week(2) ->
    tuesday;
day_of_week(3) ->
    wednesday;
day_of_week(4) ->
    thursday;
day_of_week(5) ->
    friday;
day_of_week(6) ->
    saturday;
day_of_week(7) ->
    sunday.

%%

objects2workout([], Acc) ->
    lists:reverse(Acc);
objects2workout([Arr|Rest], Acc) ->
    Workout = object2workout(Arr),
    objects2workout(Rest, [Workout|Acc]).

object2workout({array, [Start,Stop,Id,Seats,Reserved,_Unknown,
                        TypeId,Desc,Coach,Queue,_,_]}) ->
    Type = case TypeId of
               0 ->
                   kids;
               1 ->
                   coach;
               2 ->
                   competition;
               5 ->
                   manned;
               9 ->
                   keycard;
               14 ->
                   competition;
               _ ->
                   unknown
           end,
    #workout{date=gtostr(Start+?BASE_SECS_1970, date),
             day_of_week=gtostr(Start+?BASE_SECS_1970, day_of_week),
             start=gtostr(Start+?BASE_SECS_1970, time24hm),
             stop=gtostr(Stop+?BASE_SECS_1970, time24hm),
             id=Id,
             seats=Seats,
             reserved=Reserved,
             type=Type,
             coach=[C || C <- Coach, C =< 127 orelse C >= 164, C >= 32],
             description=[C || C <- Desc, C =< 127 orelse C >= 164, C >= 32],
             queue=Queue}.

inc_date(Date, Inc) ->
    DateSecs = calendar:datetime_to_gregorian_seconds({Date, {0,0,0}}),
    FutureSecs = DateSecs + ?DAY_SECS*Inc,
    {FutureDate,_} = calendar:gregorian_seconds_to_datetime(FutureSecs),
    FutureDate.

process_user(User) ->
    ?liof("process user: ~s\n", [User#user.username]),
    Date = date(),
    ?liof("Date=~p\n", [Date]),
    EndDate = inc_date(Date, ?BOOK_AHEAD+1),
    DateD = to_date(Date),
    Booked = [B || B <- User#user.booked, B#booked.date >= DateD],
    %% ?liof("Booked=~p\n", [Booked]),
    NewBooked = process_days(Date, EndDate, User, Booked),
    %% ?liof("NewBooked=~p\n", [NewBooked]),
    User#user{booked=NewBooked}.

to_date({Y,M,D}) ->
    #date{year=Y, month=M, day=D}.

process_days(Date, Date, _User, Booked) ->
    Booked;
process_days(Date, EndDate, User, Booked) ->
    ?liof("process days: ~p\n", [Date]),
    ?liof("booked: ~p\n", [Booked]),
    NextDate = inc_date(Date, 1),
    case lists:keymember(to_date(Date), #booked.date, Booked) of
        true ->
            ?liof("already booked\n", []),
            process_days(NextDate, EndDate, User, Booked);
        false ->
            ?liof("not booked ~p\n", [to_date(Date)]),
            Plan = User#user.plan,
            DayOfWeek = calendar:day_of_the_week(Date),
            WeekDay = day_of_week(DayOfWeek),
            Capacity = get_day(Date),
            NewBooked = process_plan(Date, WeekDay, Capacity, User, Plan, Booked),
            process_days(NextDate, EndDate, User, NewBooked)
    end.

process_plan(_Date, _WeekDay, _Capacity, _User, [], Booked) ->
    Booked;
process_plan(Date, WeekDay, Capacity, User, [P|Plan], Booked) ->
    %% ?liof("process plan: ~p\n", [P]),
    #plan{day=WD, time=TD, type=Type} = P,
    if WeekDay == WD ->
            case find_match(TD, Type, Capacity) of
                not_found ->
                    %% ?liof("no match found\n", []),
                    process_plan(Date, WeekDay, Capacity, User,
                                 Plan, Booked);
                Workout ->
                    %% ?liof("match ~p\n", [Workout]),
                    case book_workout(Workout, User) of
                        {error, Reason} when Reason /= already_booked ->
                            ?liof("Failed to book: ~p\n", [Reason]),
                            process_plan(Date, WeekDay, Capacity, User,
                                         Plan, Booked);
                        _ ->
                            B = #booked{date=to_date(Date), time=TD},
                            process_plan(Date, WeekDay, Capacity, User,
                                         Plan, [B|Booked])
                    end
            end;
       true ->
            process_plan(Date, WeekDay, Capacity, User, Plan, Booked)
    end.

find_match(_TimeOfDay, _Type, []) ->
    not_found;
find_match(TimeOfDay, Type, [W=#workout{start=Start, type=PType}|_Ws])
  when TimeOfDay == Start, Type == PType ->
    W;
find_match(TimeOfDay, Type, [_|Ws]) ->
    find_match(TimeOfDay, Type, Ws).

login_user(User) ->
    login(User#user.bookinguser, User#user.bookingpass).

book_workout(Workout, User) ->
    ?liof("book workout ~p\n", [Workout]),
    case login_user(User) of
        failed ->
            ?liof("login failed\n", []),
            {error, failed};
        Cookies ->
            ?liof("logged in, book\n", []),
            book(User#user.bookingfull, User#user.bookingname,
                 Workout#workout.id, Cookies)
    end.


%% 

user2object(U) ->
    val2json(U).

record2json(Record, RecordName) ->
    Fields = fields(RecordName),
    {struct, [{"record_name", ?a2l(RecordName)}|
              fields2json(Fields, tl(?t2l(Record)))]}.

fields(user) ->
    record_info(fields, user);
fields(booked) ->
    record_info(fields, booked);
fields(date) ->
    record_info(fields, date);
fields(plan) ->
    record_info(fields, plan).

types(user) ->
    tl(?t2l(#user_type{}));
types(booked) ->
    tl(?t2l(#booked_type{}));
types(date) ->
    tl(?t2l(#date_type{}));
types(plan) ->
    tl(?t2l(#plan_type{})).

fields2json([], []) -> [];
fields2json([F|Fs], [V|Vs]) ->
    [{?a2l(F), val2json(V)}|fields2json(Fs, Vs)].

val2json(A) when is_atom(A) ->
    ?a2l(A);
val2json(T) when is_tuple(T) ->
    Name = element(1, T),
    record2json(T, Name);
val2json(I) when is_integer(I) ->
    ?i2l(I);
val2json(L) when is_list(L) ->
    case io_lib:printable_list(L) of
        true ->
            L;
        false ->
            {array, [val2json(V) || V <- L]}
    end.



json2val([]) ->
    "";
json2val({array, Json}) ->
    [json2val(J) || J <- Json];
json2val({struct, Json}) ->
    case lists:keysearch("record_name", 1, Json) of
        {value, {_, NameStr}} ->
            Json1 = lists:keydelete("record_name", 1, Json),
            Name = ?l2a(NameStr),
            Spec = lists:zip(fields(Name), types(Name)),
            Vs = json2val_type(Json1, Spec),
            ?l2t([Name|Vs]);
        _ ->
            error
    end.

json2val_type([], _Spec) ->
    [];
json2val_type([{N,V}|Vs], Spec) ->
    {value, {_, Type}} = lists:keysearch(?l2a(N), 1, Spec),
    [json2val(V, Type)|json2val_type(Vs, Spec)].

json2val("", _) ->
    [];
json2val(V, string) ->
    V;
json2val(V, atom) ->
    ?l2a(V);
json2val(V, record) ->
    json2val(V);
json2val(V, integer) ->
    ?l2i(V);
json2val(V, boolean) ->
    ?l2a(V);
json2val(V, list) ->
    json2val(V).

read_users() ->
    case file:read_file(?USER_DB) of
        {ok, B} ->
            {ok, Json} = json2:decode_string(?b2l(B)),
            json2val(Json);
        _ ->
            file:copy(?USER_DB++".start", ?USER_DB),
            read_users()
    end.

store_users(Users) ->
    UserArray = val2json(Users),
    String = idrott_json2:encode_pretty(UserArray),
    file:write_file(?USER_DB_TMP, String),
    file:rename(?USER_DB_TMP, ?USER_DB).
