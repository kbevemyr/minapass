import React, {Component} from 'react';
import { withRouter } from 'react-router-dom';

import MySchemaItem from './MySchemaItem';

import './inline.css';

class MySchema extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isBooked: this.props.userdata.booked !== "",
    }
  }

  render() {
    const compareBookings = (a,b) => {
      let aTimeValue = a.time.split(':');
      let aValue = a.date.year*10000000+a.date.month*100000+a.date.day*1000+aTimeValue[0]*100+aTimeValue[1];
      let bTimeValue = a.time.split(':');
      let bValue = b.date.year*10000000+b.date.month*100000+b.date.day*1000+bTimeValue[0]*100+bTimeValue[1];

      return aValue - bValue;
    }

    return (
      <div className="dynamiccardarea">
      {this.state.isBooked &&
        <div>
          {
            this.props.userdata.booked.sort(compareBookings).map(x =>
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
