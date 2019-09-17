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

function PrivateRoute({ component: Component, auth, data, cb, ...rest }) {
  console.log("PrivateRoute " + JSON.stringify(Component) + " : "+JSON.stringify(auth));
  return (
    <Route
      {...rest}
      render={props =>
        auth ? (
          <Component {...props} userdata={data} callback={cb}/>
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

// https://kentcdodds.com/blog/application-state-management-with-react
function App() {
  const [userdata, updateUserdata] = useState(generateEmptyData());
  const [sid, setSid] = useState("");
  const [isAuthenticated, setAuthenticated] = useState(false);

  const authenticate = (newsid, last) => {
    console.log("authenticate: "+newsid);
    setAuthenticated((x) => true);
    setSid((y) => newsid);
    initUserdata(newsid, last);
  }

  const signout = () => {
    console.log("signout");
    setAuthenticated((x) => false);
    updateUserdata(generateEmptyData());
  }

  const initUserdata = (x, last) => {
    getBookingUser(x).then((data) => { updateUserdata((z) => data); last(); });
  }

  const updatePlan = (plan) => {
    updateUserdata((p) => Object.assign({}, userdata, {
      plan: p,
    }))
  }

  const updateBookingUser = (x,y) => {
    console.log("updateBookingUser");
    setBookingUser(x,y).then((res) => console.log("done updateBookingUser"));
  }

  const nop = () => {
    console.log("nop");
  }

  //browser.cookie.get({name: 'sid'}).then((c) => updateUserdata(c.value));
  var cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)sid\s*\=\s*([^;]*).*$)|^.*$/, "$1");
  console.log("cookieValue = "+document.cookie);

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
        <button id="butRefresh" aria-label="Refresh" onClick={() => updateBookingUser(sid,userdata)}></button>
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

        <Switch>
          <Route path="/login" render={() => <LoginDialog callback={ authenticate }/>} />
          <Route path="/" exact component={Splash} />
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
        </Switch>

      </main>

    </div>
  );
}

export default withRouter(App);
