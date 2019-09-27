import React, {Component} from 'react';
import { Redirect, withRouter } from 'react-router-dom';

import {loginUser} from './UserData';

import './inline.css';

class LoginDialog extends Component {
  constructor(props) {
    super(props);
    this.handleLoginEvent = this.handleLoginEvent.bind(this);
    console.log("LoginDialog constructor");
    this.state = {
      redirectToReferrer: false,
      unvalue: "",
      pwvalue: "",
      message: "",
    }
  }

  handleCancelEvent() {
    console.log("got CancelEvent");
  }

  handleLoginEvent() {
    const {unvalue, pwvalue} = this.state;
    console.log("got LoginEvent");
    loginUser(unvalue, pwvalue)
      .then((res) => {
        console.log("after login "+JSON.stringify(res));
        if(res.status === "error") {
          this.setState({message: res.reason})
        } else {
          this.props.callback(res.sid, () => this.setState({redirectToReferrer: true}));
        }
      });
  }

  handleKeyEvent() {

  }

  render() {
    let { from } = this.props.location.state || { from: { pathname: "/" } };
    let { redirectToReferrer } = this.state;

    console.log("redirvalue "+JSON.stringify(redirectToReferrer));
    if (redirectToReferrer) {
      console.log("redir " + JSON.stringify(from));
      return (<Redirect to={from} />);
    }

    return (
      <div id="LoginDialogComponent">
        <div className="dialog">
          <div className="dialog-title">Logga in</div>
            <div className="dialog-body">

                <div className="unit">
                    <label htmlFor="username">Epost</label>
                    <input type="text"
                      tabIndex="1"
                      autoComplete="username"
                      id="username"
                      name="username"
                      onChange={(e) => this.setState({unvalue: e.target.value})}
                    />
                </div>

                <div className="unit">
                    <label htmlFor="passwd">Lösenord</label>
                    <input type="password"
                           tabIndex="2"
                           autoComplete="current-password"
                           id="passwd"
                           name="passwd"
                           minLength="8"
                           required
                           onChange={(e) => this.setState({pwvalue: e.target.value})}
                    />
                </div>

                {this.state.message !== "" &&
                  <div className="unit">
                    <p className="message">{this.state.message}</p>
                  </div>
                }

                <div className="dialog-buttons">
                  <button type="button" tabIndex="4" id="butLoginDialogCancel" className="button" onClick={this.handleCancelEvent}>Avbryt</button>
                  <button type="button" tabIndex="3" id="butLoginDialogAdd" className="button" onClick={this.handleLoginEvent}>Logga in</button>
                </div>
            </div>
        </div>
      </div>
    );
  }
}

export default withRouter(LoginDialog);
