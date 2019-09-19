import React, {Component} from 'react';
import { withRouter } from 'react-router-dom';
import './inline.css';

import NewPlanItemDialog from './NewPlanItemDialog';
import MyPlanItem from './MyPlanItem';

class MyPlan extends Component {
  constructor(props) {
    super(props);
    this.handleOpenDialog = this.handleOpenDialog.bind(this);
    this.handleCloseDialog = this.handleCloseDialog.bind(this);
    this.handleAddPlanItem = this.handleAddPlanItem.bind(this);
    this.state = {
      isPlanned: this.props.userdata.plan !== "",
      addDialog: false,
    }
  }

  handleOpenDialog () {
    this.setState({addDialog: true});
  }
  handleCloseDialog () {
    this.setState({addDialog: false});
  }

  handleAddPlanItem (newplanitem) {
    console.log("got handleAddPlanItem "+JSON.stringify(newplanitem));
    console.log("userdata: "+JSON.stringify(this.props.userdata));
    //this.props.userdata.plan.push(newplanitem);
    var newplan = this.props.userdata.plan;
    newplan.push(newplanitem);
    this.props.callback(newplan, this.handleCloseDialog);
  }

  render() {
    return (
      <div>
        <div>My Plan</div>

        <button id="butAdd" className="fab" aria-label="Add" onClick={this.handleOpenDialog}>
          <span className="icon add"></span>
        </button>

        {this.state.isPlanned &&
        <div>
          {
            this.props.userdata.plan.map(x =>
              (
                <MyPlanItem key={x.day+x.time+x.type}
                  day={x.day}
                  time={x.time}
                  type={x.type}
                  cross={this.props.onCross}
                />
              )
            )
          }
        </div>
      }

      {this.state.addDialog &&
        <NewPlanItemDialog onAdd={this.handleAddPlanItem} onAbort={this.handleCloseDialog} />
      }
      </div>
    );
  }
}

export default withRouter(MyPlan);
