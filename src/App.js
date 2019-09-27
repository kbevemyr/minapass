import React, {useState, useEffect} from 'react';
import { Route, Link, Redirect, withRouter } from 'react-router-dom';
//import './App.css';
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


// https://kentcdodds.com/blog/application-state-management-with-react
function App() {
  const [userdata, setUserdata] = useState(generateEmptyData());
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [updateServer, setUpdateServer] = useState("");

  const authenticate = (sid, last) => {
    console.log("authenticate: " + sid);
    window.localStorage.setItem('mysid', sid);
    setAuthenticated(true);
    updateUserdata(sid, last);
  }

  const signout = () => {
    console.log("signout");
    window.localStorage.removeItem('mysid');
    setAuthenticated(false);
    setUserdata(generateEmptyData());
    //alert("redirect: ");
    //last("/");
    //this.props.history.push("/");
  }

  const updateUserdata = (sid, closeFlowCb) => {
    getBookingUser(sid)
      .then((res) => { // check for error
        if(res.status === "error") {
          console.log("after getBookingUser: "+res.reason);
        } else {
          if(res.user.plan === "") {
            res.user.plan = [];
          }
          if(res.user.booked === "") {
            res.user.booked = [];
          }
          setUserdata(res.user);
          closeFlowCb(); //tänkt att den stänger inmatningsdialogen, bra?
        }
    });
  }

  const updatePlan = (newplan, closeFlowCb) => {
    setUserdata((ud) => Object.assign({}, ud, {plan: newplan}));
    setUpdateServer(closeFlowCb);
  }

  const updateProfile = (profiledata, closeFlowCb) => {
    setUserdata((ud) => Object.assign({}, ud, profiledata));
    setUpdateServer(closeFlowCb);
  }

  const checkIsAuthenticated = () => {
    var mysid = window.localStorage.getItem('mysid');
    console.log("mysid from localstorage: "+mysid);
    if (mysid) {
      updateUserdata(mysid, setAuthenticated(true));
    }
  }

  useEffect(() => {
    if (updateServer !== "") {
      setBookingUser(userdata)
        .then((res) => {
          if(res.status === "error") {
            console.log("after setBookingUser: "+res.reason);
          } else {
            setUpdateServer("");
          }
        });
    }
  }, [userdata, updateServer]);

/*
  useEffect(() => {
    if (!isAuthenticated) {
      this.props.history.push("/");
    }
  }, [isAuthenticated]);
  */

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

  //checkIsAuthenticated();

  return (
    <div className="App">

      <header className="header">
        <Link to="/schema"><button id="butBooking" aria-label="Mina bokningar"></button></Link>
        <Link to="/profile"><button id="butProfile" aria-label="Min profil"></button></Link>
        <Link to="/plan"><button id="butPlan" aria-label="Min plan"></button></Link>

        <h1>
          <Link to="/">Mina pass</Link>&nbsp;
          <a href="https://gt16.se/" className="powered-by">
            by GT16
          </a>
        </h1>

        <button id="butInstall" aria-label="Install" hidden></button>
        <button id="butRefresh" aria-label="Refresh" hidden onClick={() => nop()}></button>
        <button id="butLogout" aria-label="Logout" onClick={signout}></button>
      </header>

      <main className="main">

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
          callback={updateProfile}
        />

      </main>

    </div>
  );
}

export default withRouter(App);
