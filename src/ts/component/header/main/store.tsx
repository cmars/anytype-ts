import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, UtilObject, keyboard, sidebar } from 'Lib';

const HeaderMainStore = observer(class HeaderMainStore extends React.Component<I.HeaderComponent, object> {

	constructor (props: I.HeaderComponent) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { tabs, tab, onTab, onTooltipShow, onTooltipHide } = this.props;
		const cmd = keyboard.cmdSymbol();
		
		return (
			<React.Fragment>
				<div className="side left">
					<Icon
						className="toggle big"
						tooltip="Toggle sidebar fixed mode"
						tooltipCaption={`${cmd} + \\, ${cmd} + .`}
						tooltipY={I.MenuDirection.Bottom}
						onClick={() => sidebar.toggleExpandCollapse()}
					/>
					<Icon className="expand big" tooltip="Open as object" onClick={this.onOpen} />
				</div>

				<div className="side center">
					<div id="tabs" className="tabs">
						{tabs.map((item: any) => (
							<div 
								key={`tab-store-${item.id}`} 
								className={[ 'tab', (item.id == tab ? 'active' : '') ].join(' ')} 
								onClick={() => onTab(item.id)}
								onMouseOver={e => onTooltipShow(e, item.tooltip, item.tooltipCaption)} 
								onMouseOut={onTooltipHide}
							>
								{item.name}
							</div>
						))}
					</div>
				</div>

				<div className="side right" />
			</React.Fragment>
		);
	};

	onOpen () {
		UtilObject.openRoute({ layout: I.ObjectLayout.Store });
	};

});

export default HeaderMainStore;