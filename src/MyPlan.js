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
    this.handleDeletePlanItem = this.handleDeletePlanItem.bind(this);
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
    var newplan = this.props.userdata.plan;
    newplan.push(newplanitem);
    this.props.callback(newplan, this.handleCloseDialog);
  }

  handleDeletePlanItem (planitem) {
    console.log("got handleDeletePlanItem "+JSON.stringify(planitem));
    let newplan = this.props.userdata.plan.filter((x) => {return (x.day !== planitem.day || x.time !== planitem.time || x.type !== planitem.type)});
    this.props.callback(newplan, () => {console.log("item deleted: "+JSON.stringify(planitem))});
  }

  render() {
    return (
      <div className="dynamiccardarea">
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
                  onCross={this.handleDeletePlanItem}
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
