import React, {Component} from 'react';
import { withRouter } from 'react-router-dom';

import './inline.css';

class MySchemaItem extends Component {
  constructor(props) {
    super(props);
    let {year, month, day} = this.props.date;
    this.state = {
      date: new Date(year, (month-1), day),
      locale: "sv-sv",
      options: { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' },
    }
  }

  render() {
    return (
      <div id="MySchemaItemComponent" className="plan-card">
        <div className="card-spinner" hidden>
          <svg viewBox="0 0 32 32" width="32" height="32">
            <circle cx="16" cy="16" r="14" fill="none"></circle>
          </svg>
        </div>
        <div className="location">{this.state.date.toLocaleDateString(this.state.locale, this.state.options)}</div>
        <div className="description">{this.props.time}</div>
      </div>
    );
  }
}

export default withRouter(MySchemaItem);
