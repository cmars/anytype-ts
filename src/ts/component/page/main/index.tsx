import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconObject, ListIndex, Cover, HeaderMainIndex as Header, FooterMainIndex as Footer, Filter } from 'ts/component';
import { commonStore, blockStore, detailStore, menuStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I, C, Util, DataUtil, translate, crumbs, Storage, analytics } from 'ts/lib';
import arrayMove from 'array-move';

interface Props extends RouteComponentProps<any> {}

interface State {
	tab: Tab;
	filter: string;
	pages: any[];
};

const $ = require('jquery');
const Constant: any = require('json/constant.json');

enum Tab {
	None		 = '',
	Favorite	 = 'favorite',
	Recent		 = 'recent',
	Set			 = 'set',
	Archive		 = 'archive',
};

const Tabs = [
	{ id: Tab.Favorite, name: 'Favorites' },
	{ id: Tab.Recent, name: 'History' },
	{ id: Tab.Set, name: 'Sets' },
	{ id: Tab.Archive, name: 'Bin' },
];

const PageMainIndex = observer(class PageMainIndex extends React.Component<Props, State> {
	
	refFilter: any = null;
	id: string = '';
	timeoutFilter: number = 0;
	selected: string[] = [];

	state = {
		tab: Tab.Favorite,
		filter: '',
		pages: [],
	};

	constructor (props: any) {
		super(props);
		
		this.getList = this.getList.bind(this);
		this.onAccount = this.onAccount.bind(this);
		this.onProfile = this.onProfile.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onStore = this.onStore.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onSearch = this.onSearch.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onSelectionDelete = this.onSelectionDelete.bind(this);
		this.onSelectionRestore = this.onSelectionRestore.bind(this);
		this.onSelectionAll = this.onSelectionAll.bind(this);
		this.onSelectionClose = this.onSelectionClose.bind(this);
	};
	
	render () {
		const { cover } = commonStore;
		const { config } = commonStore;
		const { root, profile, recent } = blockStore;
		const element = blockStore.getLeaf(root, root);
		const { tab, filter } = this.state;
		const canDrag = [ Tab.Favorite ].indexOf(tab) >= 0

		if (!element) {
			return null;
		};

		const object = detailStore.get(profile, profile, []);
		const { name } = object;
		const list = this.getList();

		const TabItem = (item: any) => (
			<div className={[ 'tab', (tab == item.id ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onTab(item.id); }}>
				{item.name}
			</div>
		);

		return (
			<div>
				<Cover {...cover} />
				<Header {...this.props} />
				<Footer {...this.props} />
				
				<div id="body" className="wrapper">
					<div id="title" className="title">
						{name ? Util.sprintf(translate('indexHi'), Util.shorten(name, 24)) : ''}
						
						<div className="rightMenu">
							<Icon id="button-account" className="account" tooltip="Accounts" onClick={this.onAccount} />
							<Icon id="button-add" className="add" tooltip="Add new object" onClick={this.onAdd} />
							<Icon id="button-store" className="store" tooltip="Library" onClick={this.onStore} />
							<IconObject getObject={() => { return { ...object, layout: I.ObjectLayout.Human } }} size={56} tooltip="Your profile" onClick={this.onProfile} />
						</div>
					</div>
					
					<div id="documents" className={Util.toCamelCase('tab-' + tab)}> 
						<div id="tabWrap" className="tabWrap">
							<div className="tabs">
								{Tabs.map((item: any, i: number) => (
									<TabItem key={i} {...item} />
								))}
							</div>
							<div className="btns">
								<div id="searchWrap" className="btn searchWrap" onClick={this.onSearch}>
									<Icon className="search" />
									<Filter 
										ref={(ref: any) => { this.refFilter = ref; }} 
										placeholder="" 
										placeholderFocus="" 
										value={filter}
										onChange={this.onFilterChange}
									/>
								</div>
								{(tab == Tab.Recent) && list.length ? <div className="btn" onClick={this.onClear}>Clear</div> : ''}
							</div>
						</div>
						<div id="selectWrap" className="tabWrap">
							<div className="tabs">
								<div id="selectCnt" className="side left"></div>
								<div className="side right">
									<div className="element" onClick={this.onSelectionDelete}>
										<Icon className="delete" />
										<div className="name">Delete</div>
									</div>
									<div className="element" onClick={this.onSelectionRestore}>
										<Icon className="restore" />
										<div className="name">Restore</div>
									</div>
									<div className="element" onClick={this.onSelectionAll}>
										<Icon className="all" />
										<div className="name">Select all</div>
									</div>
									<div className="element" onClick={this.onSelectionClose}>
										<Icon className="close" />
									</div>
								</div>
							</div>
						</div>
						<ListIndex 
							onClick={this.onClick} 
							onSelect={this.onSelect} 
							onAdd={this.onAdd}
							onMore={this.onMore}
							onSortStart={this.onSortStart}
							onSortEnd={this.onSortEnd}
							getList={this.getList}
							helperContainer={() => { return $('#documents').get(0); }} 
							canDrag={canDrag}
						/>
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const win = $(window);

		crumbs.delete(I.CrumbsType.Page);

		this.onScroll();
		this.onTab(Storage.get('tabIndex') || Tabs[0].id);

		win.unbind('scroll.page').on('scroll.page', (e: any) => { this.onScroll(); });
	};
	
	componentDidUpdate () {
		this.resize();

		if (this.id) {
			const node = $(ReactDOM.findDOMNode(this));
			const item = node.find(`#item-${this.id}`);

			item.addClass('hover');
		};

		this.selectionRender();
	};

	componentWillUnmount () {
		$(window).unbind('scroll.page');
		menuStore.closeAll(Constant.menuIds.index);
	};

	onScroll () {
		const win = $(window);
		const top = win.scrollTop();
		const node = $(ReactDOM.findDOMNode(this));
		const title = node.find('#title');
		const list = node.find('#documents');
		if (!list.length) {
			return;
		};

		const oy = list.offset().top;
		const menu = $('#menuSelect.add');
		const offset = 256;

		let y = 0;
		if (oy - top <= offset) {
			y = oy - top - offset;
		};

		title.css({ transform: `translate3d(0px,${y}px,0px)` });
		menu.css({ transform: `translate3d(0px,${y}px,0px)`, transition: 'none' });
	};

	onTab (id: Tab) {
		let tab = Tabs.find((it: any) => { return it.id == id; });
		if (!tab) {
			tab = Tabs[0];
			id = tab.id;
		};

		this.state.tab = id;	
		this.setState({ tab: id, pages: [] });

		Storage.set('tabIndex', id);
		analytics.event('TabHome', { tab: tab.name });

		if ([ Tab.Archive, Tab.Set ].indexOf(id) >= 0) {
			this.load();
		};
	};

	load () {
		const { tab, filter } = this.state;
		const { config } = commonStore;

		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: tab == Tab.Archive },
		];
		const sorts = [
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc }
		];

		if (tab == Tab.Set) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.set });
		};

		if (!config.debug.ho) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false });
		};

		C.ObjectSearch(filters, sorts, Constant.defaultRelationKeys, filter, 0, 100, (message: any) => {
			if (message.error.code) {
				return;
			};

			this.setState({ pages: message.records });
		});
	};

	onSearch (e: any) {
		e.stopPropagation();

		const node = $(ReactDOM.findDOMNode(this));
		const searchWrap = node.find('#searchWrap');
		const page = $('.page');

		if (searchWrap.hasClass('active')) {
			return;
		};

		searchWrap.addClass('active');
		this.refFilter.focus();

		window.setTimeout(() => {
			page.unbind('click').on('click', (e: any) => {
				if ($.contains(searchWrap.get(0), e.target)) {
					return;
				};

				searchWrap.removeClass('active');
				page.unbind('click');

				window.setTimeout(() => { this.setFilter(''); }, 210);
			});
		}, 210);
	};

	onFilterChange (v: string) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => { this.setFilter(v); }, 500);
	};

	setFilter (v: string) {
		if (this.refFilter) {
			this.refFilter.setValue(v);
		};
		this.setState({ filter: v });
		this.load();
	};

	onAccount () {
		menuStore.open('account', {
			element: '#button-account',
			horizontal: I.MenuDirection.Right
		});
	};
	
	onProfile (e: any) {
		const { profile } = blockStore;
		const object = detailStore.get(profile, profile, []);

		DataUtil.objectOpenEvent(e, object);
	};
	
	onClick (e: any, item: any) {
		e.stopPropagation();
		e.persist();

		const { tab } = this.state;
		const object = item.isBlock ? item._object_ : item;

		if (tab == Tab.Archive) {
			return;
		};

		crumbs.cut(I.CrumbsType.Page, 0, () => {
			DataUtil.objectOpenEvent(e, object);
		});
	};

	getObject (item: any) {
		return item.isBlock ? item._object_ : item;
	};

	onSelect (e: any, item: any) {
		e.stopPropagation();
		e.persist();

		let object = this.getObject(item);
		let idx = this.selected.indexOf(object.id);
		if (idx >= 0) {
			this.selected.splice(idx, 1);
		} else {
			this.selected.push(object.id);
		};

		this.selected = Util.arrayUnique(this.selected);
		this.selectionRender();
	};

	selectionRender () {
		const node = $(ReactDOM.findDOMNode(this));
		const wrapper = node.find('#documents');
		const cnt = node.find('#selectCnt');
		const l = this.selected.length;

		l ? wrapper.addClass('isSelecting') : wrapper.removeClass('isSelected');
		cnt.text(`Selected ${l} ${Util.cntWord(l, 'object', 'objects')}`);

		node.find('.item.isSelected').removeClass('isSelected');
		this.selected.forEach((id: string) => {
			node.find(`#item-${id}`).addClass('isSelected');
		});
	};

	onSelectionDelete (e: any) {
		C.ObjectListDelete(this.selected, () => {
			this.load();
		});
	};
	
	onSelectionRestore (e: any) {

	};

	onSelectionAll (e: any) {
		const items = this.getList();
		
		this.selected = [];

		items.forEach((it: any) => {
			let object = this.getObject(it);
			this.selected.push(object.id);
		});

		this.selectionRender();
	};

	onSelectionClose (e: any) {
		this.selected = [];
		this.selectionRender();
	};

	onStore (e: any) {
		DataUtil.objectOpenPopup({ layout: I.ObjectLayout.Store });
	};
	
	onAdd (e: any) {
		DataUtil.pageCreate('', '', { isDraft: true }, I.BlockPosition.Bottom, '', {}, (message: any) => {
			this.load();

			DataUtil.objectOpenPopup({ id: message.targetId });
		});
	};

	onMore (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		const { tab } = this.state;
		const { root, recent, profile } = blockStore;
		const object = item.isBlock ? item._object_ : item;
		const rootId = tab == Tab.Recent ? recent : root;
		const subIds = [ 'searchObject' ];
		const favorites = blockStore.getChildren(blockStore.root, blockStore.root, (it: I.Block) => {
			return it.isLink() && (it.content.targetBlockId == object.id);
		});

		let menuContext = null;
		let archive = null;
		let link = null;
		let remove = null;
		let move = { id: 'move', icon: 'move', name: 'Move to', arrow: true };
		let types = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page).map((it: I.ObjectType) => { return it.id; });
		types = types.filter((it: string) => { return it != Constant.typeId.page; });

		if (favorites.length) {
			link = { id: 'unfav', icon: 'unfav', name: 'Remove from Favorites' };
		} else {
			link = { id: 'fav', icon: 'fav', name: 'Add to Favorites' };
		};

		if (object.isArchived) {
			link = null;
			remove = { id: 'remove', icon: 'remove', name: 'Delete' };
			archive = { id: 'unarchive', icon: 'undo', name: 'Restore from bin' };
		} else {
			archive = { id: 'archive', icon: 'remove', name: 'Move to bin' };
		};

		if (object.isReadonly || object.templateIsBundled || (object.id == profile)) {
			archive = null;
		};

		if ([ Tab.Favorite ].indexOf(tab) < 0) {
			move = null;
		};

		const options = [
			archive,
			remove,
			move,
			link,
		];

		const onArchive = (v: boolean) => {
			const cb = (message: any) => {
				if (message.error.code) {
					return;
				};

				if (object.type == Constant.typeId.type) {
					dbStore.objectTypeUpdate({ id: object.id, isArchived: v });
				};

				this.load();
			};

			C.ObjectSetIsArchived(object.id, v, cb);
		};

		menuStore.open('select', { 
			element: `#button-${item.id}-more`,
			offsetY: 8,
			horizontal: I.MenuDirection.Center,
			className: 'fromIndex',
			subIds: subIds,
			onOpen: (context: any) => {
				menuContext = context;
			},
			data: {
				options: options,
				onOver: (e: any, el: any) => {
					menuStore.closeAll(subIds, () => {
						if (el.id == 'move') {
							const filters = [
								{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: types }
							];

							menuStore.open('searchObject', {
								element: `#menuSelect #item-${el.id}`,
								offsetX: menuContext.getSize().width,
								vertical: I.MenuDirection.Center,
								isSub: true,

								data: {
									rebind: menuContext.ref.rebind,
									rootId: rootId,
									blockId: item.id,
									blockIds: [ item.id ],
									type: I.NavigationType.Move, 
									skipId: rootId,
									position: I.BlockPosition.Bottom,
									onSelect: (el: any) => { menuContext.close(); }
								}
							});
						};
					});
				},
				onSelect: (e: any, el: any) => {
					if (el.arrow) {
						menuStore.closeAll(subIds);
						return;
					};

					switch (el.id) {
						case 'archive':
							onArchive(true);
							break;

						case 'unarchive':
							onArchive(false);
							break;

						case 'fav':
							C.ObjectSetIsFavorite(object.id, true);
							break;

						case 'unfav':
							C.ObjectSetIsFavorite(object.id, false);
							break;

						case 'remove':
							C.ObjectListDelete([ object.id ], (message: any) => {
								this.load();
							});
							break;
					};
				},
			},
		});
	};

	onSortStart (param: any) {
		const { node } = param;

		this.id = $(node).data('id');
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		
		if (oldIndex == newIndex) {
			return;
		};
		
		const { root } = blockStore;
		const list = this.getList();
		const current = list[oldIndex];
		const target = list[newIndex];
		const element = blockStore.getMapElement(root, root);
		
		if (!current || !target || !element) {
			return;
		};

		
		const position = newIndex < oldIndex ? I.BlockPosition.Top : I.BlockPosition.Bottom;
		const oidx = element.childrenIds.indexOf(current.id);
		const nidx = element.childrenIds.indexOf(target.id);

		blockStore.updateStructure(root, root, arrayMove(element.childrenIds, oidx, nidx));
		C.BlockListMove(root, root, [ current.id ], target.id, position);
	};
	
	resize () {
		const list = this.getList();
		const size = Constant.size.index;
		const win = $(window);
		const wh = win.height();
		const ww = win.width();
		const node = $(ReactDOM.findDOMNode(this));
		const title = node.find('#title');
		const body = node.find('#body');
		const documents = node.find('#documents');
		const items = node.find('#documents .item');
		const hh = Util.sizeHeader();

		const maxWidth = ww - size.border * 2;
		const cnt = Math.floor(maxWidth / (size.width + size.margin));
		const width = Math.floor((maxWidth - size.margin * (cnt - 1)) / cnt);
		const height = this.getListHeight();

		items.css({ width: width }).removeClass('last');
		title.css({ width: maxWidth });
		body.css({ width: maxWidth });
		documents.css({ marginTop: wh - size.titleY - height - hh });

		items.each((i: number, item: any) => {
			item = $(item);
			const icon = item.find('.iconObject');

			if ((i + 1) >= cnt && ((i + 1) % cnt === 0) && (list.length + 1 > cnt)) {
				item.addClass('last');
			};
			if (icon.length) {
				item.addClass('withIcon');
			};
		});

		this.onScroll();
	};

	getListHeight () {
		const size = Constant.size.index;
		return (size.height + size.margin) * 2 + size.margin * 2;
	};

	getList () {
		const { root, recent } = blockStore;
		const { config } = commonStore;
		const { tab, filter, pages } = this.state;
		
		let reg = null;
		let list: any[] = [];
		let rootId = root;
		let recentIds = [];

		if (filter) {
			reg = new RegExp(Util.filterFix(filter), 'gi');
		};

		switch (tab) {
			default:
			case Tab.Favorite:
			case Tab.Recent:
				if (tab == Tab.Recent) {
					rootId = recent;
					recentIds = crumbs.get(I.CrumbsType.Recent).ids;
				};

				list = blockStore.getChildren(rootId, rootId, (it: any) => {
					if (!it.content.targetBlockId) {
						return false;
					};

					const object = detailStore.get(rootId, it.content.targetBlockId, []);
					const { name, isArchived } = object;

					if (reg && name && !name.match(reg)) {
						return false;
					};
					return !isArchived;
				}).map((it: any) => {
					if (tab == Tab.Recent) {
						it._order = recentIds.findIndex((id: string) => { return id == it.content.targetBlockId; });
					};

					it._object_ = detailStore.get(rootId, it.content.targetBlockId, [ 'templateIsBundled' ]);
					it.isBlock = true;
					return it;
				});

				if (tab == Tab.Recent) {
					list.sort((c1: any, c2: any) => {
						if (c1._order > c2._order) return -1;
						if (c2._order < c1._order) return 1;
						return 0;
					});
				};

				break;

			case Tab.Archive:
			case Tab.Set:
				list = pages;
				break;
		};

		return list;
	};

	onClear () {
		const recent = crumbs.get(I.CrumbsType.Recent);
		recent.ids = [];
		crumbs.save(I.CrumbsType.Recent, recent);
	};

});

export default PageMainIndex;