import React, {Component} from 'react';
import { withRouter } from 'react-router-dom';

import MySchemaItem from './MySchemaItem';

import './inline.css';

class MySchema extends Component {
  constructor(props) {
    super(props);
    this.state = {
    	lala: "Schema for ",
      isBooked: this.props.userdata.booked !== ""
    }
  }

  render() {
    return (
      <div>
        <div>My bookings</div>

      {this.state.isBooked &&
        <div>
          {
            this.props.userdata.booked.map(x =>
              (
                <MySchemaItem key={x.date.day+x.time} date={x.date} time={x.time} />
              )
            )
          }
        </div>
      }
      </div>
    );
  }
}

export default withRouter(MySchema);
