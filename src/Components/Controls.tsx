import ExpressionBanner from "./ExpressionBanner";
import GraphMgr from "../GraphManager/GraphMgr";
import '../scss/Controls.scss';
import ControlsResizer from "./ControlsResizer";

export default function Controls(
  {gmgr, updateGmgr} : {
    gmgr: GraphMgr;
    updateGmgr: () => void
  }){
  return (
    <div id='Controls'>
      <div id='controls-wrapper' style={{'width':`${gmgr.controlsWidth}px`}}>
        <div id='controls-header'></div>
        {gmgr.expressions.map((e,ei)=>{
          return <ExpressionBanner
            key={e.since}
            exprno={ei}
            gmgr={gmgr}
            updateGmgr={updateGmgr}
          />
        })}
        <div className='expression-banner' onClick={()=>{
          gmgr.pushNewExpression();
          updateGmgr();
        }}>
          <div className='expression-icon'>+</div>
          <span
            className="textarea"
            role="textbox"
            // contentEditable
            // suppressContentEditableWarning
          >{'Click here to add banner'}</span>
        </div>
      </div>
      <ControlsResizer gmgr={gmgr} updateGmgr={updateGmgr}/>
    </div>
  )
}