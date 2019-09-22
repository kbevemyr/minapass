import React, {Component} from 'react';
import { withRouter } from 'react-router-dom';
import './inline.css';

class Splash extends Component {

  render() {
    return (
      <div>
        <h1>Välkommen!</h1>
        <img src="images/CNlogga.jpg" alt="Crossfit Norrort" />
      </div>
    );
  }
}

export default withRouter(Splash);
