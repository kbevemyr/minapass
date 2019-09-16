import React, {Component} from 'react';
import { withRouter } from 'react-router-dom';

import './inline.css';

class MyPlanItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lala: "this and that",
    }
  }

  handleDeletePlanItemEvent() {
    console.log("got handleDeletePlanItemEvent");
    //this.props.onCross(this.props.key);
  }

  render() {
    return (
      <div id="MyPlanItemComponent" className="plan-card">
        <div className="card-spinner" hidden>
          <svg viewBox="0 0 32 32" width="32" height="32">
            <circle cx="16" cy="16" r="14" fill="none"></circle>
          </svg>
        </div>
        <button className="remove-city" onClick={this.handleDeletePlanItemEvent}>&times;</button>
        <div className="location">{this.props.day}</div>
        <div className="date">{this.props.time}</div>
        <div className="description">{this.props.type}</div>
      </div>
    );
  }
}

export default withRouter(MyPlanItem);
