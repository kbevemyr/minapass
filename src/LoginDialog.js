import React, {Component} from 'react';
import { Redirect, withRouter } from 'react-router-dom';

import {loginUser} from './UserData';

import './inline.css';

class LoginDialog extends Component {
  constructor(props) {
    super(props);
    this.handleLoginEvent = this.handleLoginEvent.bind(this);
    this.state = {
      redirectToReferrer: false,
      unvalue: "",
      pwvalue: "",
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
        this.setState({redirectToReferrer: true });
        this.props.callback(res.sid);
      });
  }

  render() {
    let { from } = this.props.location.state || { from: { pathname: "/" } };
    let { redirectToReferrer } = this.state;

    if (redirectToReferrer) return <Redirect to={from} />;

    return (
      <div id="LoginDialogComponent">
        <div className="dialog">
          <div className="dialog-title">Logga in</div>
          <div className="dialog-body">
            <form>
            <div className="location">
                <label htmlFor="username">Epost</label>
                <input type="text"
                       id="username"
                       name="username"
                       onChange={(e) => this.setState({unvalue: e.target.value})}
                />
            </div>

            <div className="location">
                <label htmlFor="passwd">Lösenord</label>
                <input type="password"
                       id="passwd"
                       name="passwd"
                       minLength="8"
                       required
                       onChange={(e) => this.setState({pwvalue: e.target.value})}
                />
            </div>
            </form>
          </div>

          <div className="dialog-buttons">
            <button id="butLoginDialogCancel" className="button" onClick={this.handleCancelEvent}>Avbryt</button>
            <button id="butLoginDialogAdd" className="button" onClick={this.handleLoginEvent}>Logga in</button>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(LoginDialog);