import React, {Component} from 'react';
import { withRouter } from 'react-router-dom';

import MySchemaItem from './MySchemaItem';

import './inline.css';

class MySchema extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isBooked: this.props.userdata.booked !== ""
    }
  }

  render() {
    return (
      <div className="dynamiccardarea">
      {this.state.isBooked &&
        <div>
          {
            this.props.userdata.booked.sort().map(x =>
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
