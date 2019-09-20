import React, {useState} from 'react';
import { Route, Switch, Link, Redirect, withRouter } from 'react-router-dom';
import './App.css';
import './inline.css';
import { getBookingUser, setBookingUser, generateEmptyData } from './UserData';

import Splash from './Splash';
import MyProfile from './MyProfile';
import LoginDialog from './LoginDialog';
import MyPlan from './MyPlan';
import MySchema from './MySchema';

function PrivateRoute(args) {
  console.log("PrivateRoute "+JSON.stringify(args));
  var { component: Component, auth: Auth, data: Data, callback: CB, ...rest } = args;
  return (
    <Route
      {...rest}
      render={props =>
        Auth ? (
          <Component {...props} userdata={Data} callback={CB}/>
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );
}

function initApp() {
  /* Init App */
  // tycker inte att man ska nyttja gammal sid.
  var cookieSid = document.cookie.replace(/(?:(?:^|.*;\s*)sid\s*\=\s*([^;]*).*$)|^.*$/, "$1");
  console.log("cookieSid "+cookieSid);
  if(cookieSid !== "") {
    //updateUserdata(cookieSid, () => setAuthenticated(true));
  }
}


// https://kentcdodds.com/blog/application-state-management-with-react
function App() {
  const [userdata, setUserdata] = useState(generateEmptyData());
  const [isAuthenticated, setAuthenticated] = useState(false);

  const authenticate = (newsid, last) => {
    console.log("authenticate: "+newsid);
    setAuthenticated(true);
    updateUserdata(newsid, last);
  }

  const signout = () => {
    console.log("signout");
    setAuthenticated(false);
    setUserdata(generateEmptyData());
  }

  const updateUserdata = (sidValue, closeFlowCb) => {
    getBookingUser(sidValue).then((data) => {
      if(data.plan === "") {
        data.plan = [];
      }
      if(data.booked === "") {
        data.booked = [];
      }
      setUserdata(data);
      closeFlowCb(); //tänkt att den stänger inmatningsdialogen, bra?
    });
  }

  const updatePlan = (newplan, closeFlowCb) => {
    setUserdata((ud) => Object.assign({}, ud, {plan: newplan}));
    setBookingUser(userdata.sid, userdata).then((res) => closeFlowCb());
  }

/*
  const updateBookingUser = (x,y) => {
    console.log("updateBookingUser");
    setBookingUser(x,y).then((res) => console.log("done updateBookingUser"));
    // on det blir fel så hämta nytt från servern?
  }
  */

  const nop = () => {
    console.log("nop");
  }

  return (
    <div className="App">

      <header className="header">
        <h1>
          Mina pass
          <a href="https://gt16.se/" className="powered-by">
            Powered by GT16
          </a>
        </h1>
        <button id="butInstall" aria-label="Install" hidden></button>
        <button id="butRefresh" aria-label="Refresh" onClick={() => nop()}></button>
        <button id="butLogout" aria-label="Logout" onClick={signout}></button>
      </header>

      <main className="main">

        <div id="about" className="plan-card">
          <b>App to automate your schedule at Crossfit Norrort</b>

          <ul>
            <li>
              <Link to="/">Welcome</Link>
            </li>
            <li>
              <Link to="schema">Mina bokningar</Link>
            </li>
            <li>
              <Link to="plan">Min plan</Link>
            </li>
            <li>
              <Link to="profile">Min profil</Link>
            </li>
          </ul>
        </div>

        <Route path="/login"
          render={() => <LoginDialog callback={ authenticate }/>}
        />
        <Route path="/"
          exact component={Splash}
        />
        <PrivateRoute path="/schema"
          component={MySchema}
          auth={isAuthenticated}
          data={userdata}
          callback={nop}
        />
        <PrivateRoute path="/plan"
          component={MyPlan}
          auth={isAuthenticated}
          data={userdata}
          callback={updatePlan}
        />
        <PrivateRoute path="/profile"
          component={MyProfile}
          auth={isAuthenticated}
          data={userdata}
          callback={nop}
        />

      </main>

    </div>
  );
}

export default withRouter(App);
