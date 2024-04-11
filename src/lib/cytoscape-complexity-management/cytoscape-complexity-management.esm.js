import{ComplexityManager as e}from"cmgm";function o(e,o){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);o&&(n=n.filter((function(o){return Object.getOwnPropertyDescriptor(e,o).enumerable}))),t.push.apply(t,n)}return t}function t(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(o){a(e,o,n[o])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(o){Object.defineProperty(e,o,Object.getOwnPropertyDescriptor(n,o))}))}return e}function n(e){var o=function(e,o){if("object"!=typeof e||!e)return e;var t=e[Symbol.toPrimitive];if(void 0!==t){var n=t.call(e,o||"default");if("object"!=typeof n)return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===o?String:Number)(e)}(e,"string");return"symbol"==typeof o?o:String(o)}function i(e){return i="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},i(e)}function a(e,o,t){return(o=n(o))in e?Object.defineProperty(e,o,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[o]=t,e}function r(e,o){return function(e){if(Array.isArray(e))return e}(e)||function(e,o){var t=null==e?null:"undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(null!=t){var n,i,a,r,l=[],s=!0,d=!1;try{if(a=(t=t.call(e)).next,0===o){if(Object(t)!==t)return;s=!1}else for(;!(s=(n=a.call(t)).done)&&(l.push(n.value),l.length!==o);s=!0);}catch(e){d=!0,i=e}finally{try{if(!s&&null!=t.return&&(r=t.return(),Object(r)!==r))return}finally{if(d)throw i}}return l}}(e,o)||s(e,o)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function l(e){return function(e){if(Array.isArray(e))return d(e)}(e)||function(e){if("undefined"!=typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}(e)||s(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function s(e,o){if(e){if("string"==typeof e)return d(e,o);var t=Object.prototype.toString.call(e).slice(8,-1);return"Object"===t&&e.constructor&&(t=e.constructor.name),"Map"===t||"Set"===t?Array.from(e):"Arguments"===t||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)?d(e,o):void 0}}function d(e,o){(null==o||o>e.length)&&(o=e.length);for(var t=0,n=new Array(o);t<o;t++)n[t]=e[t];return n}function c(o){var n=new e,i=o.nodes(),a=o.edges();!function e(o,t){for(var n=o.length,i=0;i<n;i++){var a=o[i],r=a.children();t.addNode(a.id(),a.parent().id()),null!=r&&r.length>0&&e(r,t)}}(function(e){var o={};return e.forEach((function(e){o[e.id()]=!0})),e.filter((function(e,t){"number"==typeof e&&(e=t);for(var n=e.parent()[0];null!=n;){if(o[n.id()])return!1;n=n.parent()[0]}return!0}))}(i),n),function(e,o){for(var t=0;t<e.length;t++){var n=e[t];o.addEdge(n.id(),n.source().id(),n.target().id())}}(a,n);var s=[],d=function(){s.forEach((function(e){if(n.visibleGraphManager.nodesMap.get(e.parent().id())){e.isNode()&&n.addNode(e.id(),e.parent().id());var o=s.indexOf(e);o>-1&&s.splice(o,1),x()}}))},c=function(e){var o=e.target;o.parent().id()?n.visibleGraphManager.nodesMap.get(o.parent().id())?(o.isNode()&&n.addNode(o.id(),o.parent().id()),x()):s.push(o):(o.isNode()?n.addNode(o.id(),o.parent().id()):(d(),n.addEdge(o.id(),o.source().id(),o.target().id())),x());d()},u=function(e){var o=e.target;o.isNode()?n.removeNode(o.id()):n.removeEdge(o.id()),x()};o.on("add",c),o.on("remove",u),o.on("move","edge",(function(e){var o=e.target;n.reconnect(o.id(),o.source().id(),o.target().id()),x()})),o.on("move","node",(function(e){var o=e.target;n.changeParent(o.id(),o.parent().id()),x()}));var p=new Set,f=function(){return o.scratch("cyComplexityManagement").options.filterRule},m=function(e,o){return new Set(l(e).filter((function(e){return!o.has(e)})))};function v(e,o){var t=o.collection();e.forEach((function(e){t.merge(o.getElementById(e))})),o.off("remove",u),o.remove(t).forEach((function(e){o.scratch("cyComplexityManagement").removedEles.set(e.id(),e)})),o.on("remove",u)}function h(e,o){return o.getElementById(e.data().parent).data()?o.getElementById(e.data().parent):e.parent().id()?h(e.parent(),o):void 0}function y(e,o){var t=o.collection(),n=o.collection();e.forEach((function(e){var i=o.scratch("cyComplexityManagement").removedEles.get(e);i&&(i.isNode()?t.merge(i):n.merge(i))})),o.off("add",c),t.forEach((function(e){var t,n,i,a,r,l,s=o.getElementById(e.id());if(s.id()){var d=o.getElementById(s.data().parent),c=h(s,o);if(c&&(c.id()!=d.id()&&(d=o.getElementById(c.id())),c.position()&&e.isChildless())){var u=(t=s.position().x,n=s.position().y,i=d.position().x,a=d.position().y,r=c.position().x,l=c.position().y,{x:t+(r-i),y:n+(l-a)});e.position(u)}}})),o.add(t.merge(n)).forEach((function(e){o.scratch("cyComplexityManagement").removedEles.delete(e.id())})),o.on("add",c)}function g(e,o){o.off("add",c),e.forEach((function(e){try{o.add({group:"edges",data:{id:e.ID,source:e.sourceID,target:e.targetID,size:e.size,compound:e.compound}})}catch(e){}})),o.on("add",c)}function x(){var e=f(),t=new Set;o.elements().forEach((function(o){e(o)&&t.add(o.id())})),o.scratch("cyComplexityManagement").removedEles.forEach((function(o){e(o)&&t.add(o.id())}));var i=m(p,t);i.forEach((function(e){p.delete(e)}));var a=m(t,p);a.forEach((function(e){p.add(e)}));var l=[],s=[],d=[],c=[];a.forEach((function(e){o.getElementById(e).length>0&&o.getElementById(e).isNode()||o.scratch("cyComplexityManagement").removedEles.has(e)&&o.scratch("cyComplexityManagement").removedEles.get(e).isNode()?l.push(e):s.push(e)})),i.forEach((function(e){var t;null!==(t=o.scratch("cyComplexityManagement").removedEles.get(e))&&void 0!==t&&t.isNode()?d.push(e):c.push(e)}));var u=n.filter(l,s),h=r(n.unfilter(d,c),2),x=h[0],b=h[1];v(u,o),y(x,o),g(b,o)}var b={getCompMgrInstance:function(){return n},updateFilterRule:function(e){o.scratch("cyComplexityManagement").options.filterRule=e,x()},getHiddenNeighbors:function(e){var t=o.collection();return e.forEach((function(e){var i=n.getHiddenNeighbors(e.id());i.nodes.forEach((function(e){t.merge(o.scratch("cyComplexityManagement").removedEles.get(e))})),i.edges.forEach((function(e){t.merge(o.scratch("cyComplexityManagement").removedEles.get(e))}))})),t},hide:function(e){var t=[],i=[];e.forEach((function(e){e.isNode()?t.push(e.id()):i.push(e.id())})),v(n.hide(t,i),o)},show:function(e){var t=[],i=[];e.forEach((function(e){e.isNode()?t.push(e.id()):i.push(e.id())}));var a=r(n.show(t,i),2),l=a[0],s=a[1];y(l,o),g(s,o)},showAll:function(){var e=r(n.showAll(),2),t=e[0],i=e[1];y(t,o),g(i,o)},collapseNodes:function(e){var t=arguments.length>1&&void 0!==arguments[1]&&arguments[1],i=[];e.forEach((function(e){n.isCollapsible(e.id())&&(i.push(e.id()),e.data("position-before-collapse",{x:e.position().x,y:e.position().y}),e.data("size-before-collapse",{w:e.outerWidth(),h:e.outerHeight()}),e.addClass("cy-expand-collapse-collapsed-node"))}));var a=n.collapseNodes(i,t),r=[],l=[];a.nodeIDListForInvisible.forEach((function(e){r.push(e)})),a.edgeIDListForInvisible.forEach((function(e){r.push(e)})),a.metaEdgeIDListForVisible.forEach((function(e){l.push(e)})),v(r,o),g(l,o)},expandNodes:function(e){var t=arguments.length>1&&void 0!==arguments[1]&&arguments[1],i=!(arguments.length>2&&void 0!==arguments[2])||arguments[2],a=[];e.forEach((function(e){n.isExpandable(e.id())&&(a.push(e.id()),i&&E(e.data().id,o),e.removeClass("cy-expand-collapse-collapsed-node"),e.removeData("position-before-collapse"),e.removeData("size-before-collapse"))})),setTimeout((function(){var e=n.expandNodes(a,t);y(l(e.nodeIDListForVisible),o),e.nodeIDListForVisible.forEach((function(e){var t=o.getElementById(e);n.isCollapsible(t.id())?(t.removeClass("cy-expand-collapse-collapsed-node"),t.removeData("position-before-collapse"),t.removeData("size-before-collapse")):n.isExpandable(t.id())&&(t.data("position-before-collapse",{x:t.position().x,y:t.position().y}),t.data("size-before-collapse",{w:t.outerWidth(),h:t.outerHeight()}),t.addClass("cy-expand-collapse-collapsed-node"))})),y(l(e.edgeIDListForVisible),o),v(l(e.edgeIDListToRemove),o),g(l(e.metaEdgeIDListForVisible),o)}),i?600:0)},collapseAllNodes:function(){var e=n.collapseAllNodes(),t=[],i=[];e.nodeIDListForInvisible.forEach((function(e){t.push(e)})),e.collapsedNodes.forEach((function(e){var t=o.getElementById(e);t.data("position-before-collapse",{x:t.position().x,y:t.position().y}),t.data("size-before-collapse",{w:t.outerWidth(),h:t.outerHeight()}),t.addClass("cy-expand-collapse-collapsed-node")})),e.edgeIDListForInvisible.forEach((function(e){t.push(e)})),e.metaEdgeIDListForVisible.forEach((function(e){i.push(e)})),v(t,o),g(i,o)},expandAllNodes:function(){var e=n.expandAllNodes();y(l(e.nodeIDListForVisible),o),e.expandedNodes.forEach((function(e){var t=o.getElementById(e);t.removeClass("cy-expand-collapse-collapsed-node"),t.removeData("position-before-collapse"),t.removeData("size-before-collapse")})),y(l(e.edgeIDListForVisible),o);var t=[];o.edges('[compound = "T"]').forEach((function(e){n.visibleGraphManager.edgesMap.has(e.data().id)||t.push(e.data().id)})),v([].concat(l(e.edgeIDListToRemove),t),o)},collapseEdges:function(e){var t=new Map;e.forEach((function(e){var o=[e.source().id(),e.target().id()].sort().join("-");t.has(o)?t.get(o).push(e.id()):t.set(o,[e.id()])})),Array.from(t.values()).forEach((function(e){if(e.length>1){var t=n.collapseEdges(e);v(e,o),g(t,o)}}))},collapseEdgesBetweenNodes:function(e){var t=[];e.forEach((function(e){t.push(e.id())}));var i=n.collapseEdgesBetweenNodes(t);v(i[0],o),g(i[1],o)},collapseAllEdges:function(){var e=n.collapseAllEdges();v(e[0],o),g(e[1],o)},expandEdges:function(e){var t=arguments.length>1&&void 0!==arguments[1]&&arguments[1],i=[];e.forEach((function(e){i.push(e.id())}));var a=n.expandEdges(i,t);v(a[2],o),y(a[0],o),g(a[1],o)},expandEdgesBetweenNodes:function(e){var t=arguments.length>1&&void 0!==arguments[1]&&arguments[1],i=[];e.forEach((function(e){i.push(e.id())}));var a=n.expandEdgesBetweenNodes(i,t);v(a[2],o),y(a[0],o),g(a[1],o)},expandAllEdges:function(){var e=n.expandAllEdges();v(e[2],o),y(e[0],o),g(e[1],o)},isCollapsible:function(e){return n.isCollapsible(e.id())},isExpandable:function(e){return n.isExpandable(e.id())}},E=function(e,o,i,a){C(n.mainGraphManager.nodesMap.get(e));var r=I(o.getElementById(e));o.nodes().unselect();var l=[];o.nodes().forEach((function(e){if(e.id()!=r.id()&&0==e.parent().length){e.isChildless()?e.select():w(e);var n=o.collection(o.$(":selected")).boundingBox();(n=t(t({},n),{},{w:e.width(),h:e.height()})).w,n.h,l.push({id:e.id(),data:o.$(":selected"),pos:{x:(n.x2+n.x1)/2,y:(n.y1+n.y2)/2}})}})),o.getElementById(e).parent().length,o.fit(),o.fit(),o.getElementById(e).select()};function C(e){var o={edges:new Set,simpleNodes:[],compoundNodes:[]},t=e.child;t&&t.nodes.forEach((function(e){var t=C(e);for(var n in t)o[n]=[].concat(l(o[n]||[]),l(t[n]));o.edges=new Set(o.edges),e.child?o.compoundNodes.push(e):o.simpleNodes.push(e),e.edges.forEach((function(e){return o.edges.add(e)}))}));return o}function w(e){var o=e.children();o.nonempty()&&o.forEach((function(e){e.select(),w(e)}))}function I(e){return 0!=e.parent().length?I(e.parent()):e}return b}var u,p,f=(u=Math.max,p=Date.now||function(){return(new Date).getTime()},function(e,o,t){var n,a,r,l,s,d,c,f,m,v=0,h=!1,y=!0;if("function"!=typeof e)throw new TypeError("Expected a function");if(o=o<0?0:+o||0,!0===t){var g=!0;y=!1}else m=i(f=t),!f||"object"!=m&&"function"!=m||(g=!!t.leading,h="maxWait"in t&&u(+t.maxWait||0,o),y="trailing"in t?!!t.trailing:y);function x(o,t){t&&clearTimeout(t),a=d=c=void 0,o&&(v=p(),r=e.apply(s,n),d||a||(n=s=void 0))}function b(){var e=o-(p()-l);e<=0||e>o?x(c,a):d=setTimeout(b,e)}function E(){x(y,d)}function C(){if(n=arguments,l=p(),s=this,c=y&&(d||!g),!1===h)var t=g&&!d;else{a||g||(v=l);var i=h-(l-v),u=i<=0||i>h;u?(a&&(a=clearTimeout(a)),v=l,r=e.apply(s,n)):a||(a=setTimeout(E,i))}return u&&d?d=clearTimeout(d):d||o===h||(d=setTimeout(b,o)),t&&(u=!0,r=e.apply(s,n)),!u||d||a||(n=s=void 0),r}return C.cancel=function(){d&&clearTimeout(d),a&&clearTimeout(a),v=0,a=d=c=void 0},C}),m=function(e,o,t){var n,i=!0;return function(){var a=this,r=arguments;clearTimeout(n),n=setTimeout((function(){n=null,e.apply(a,r),i=!0}),o),i&&(t.apply(a,r),i=!1)}},v={name:"fcose",animate:!0,randomize:!1,stop:function(){}};function h(e,o,n){var a,r=e,l=function(){var e=o.scratch("_cyExpandCollapse");return e&&e.cueUtilities},s={init:function(){var e=document.createElement("canvas");e.classList.add("expand-collapse-canvas");var i=document.getElementById("cy"),r=e.getContext("2d");i.appendChild(e);var l=function(e){var o=e.getBoundingClientRect();return{top:o.top+document.documentElement.scrollTop,left:o.left+document.documentElement.scrollLeft}};function s(){var t=i.offsetWidth,n=i.offsetHeight,a=t*p.pixelRatio,r=n*p.pixelRatio;e.width=a,e.height=r,e.style.width="".concat(t,"px"),e.style.height="".concat(n,"px"),o.trigger("cyCanvas.resize")}o.on("resize",(function(){s()})),e.setAttribute("style","position:absolute; top:0; left:0; z-index:".concat(p().zIndex,";"));var c=f((function(){e.height=o.container().offsetHeight,e.width=o.container().offsetWidth,e.style.position="absolute",e.style.top=0,e.style.left=0,e.style.zIndex=p().zIndex,setTimeout((function(){var t=l(e),n=l(i);e.style.top=-(t.top-n.top),e.style.left=-(t.left-n.left),o&&h()}),0)}),250);s();var u={};function p(){return o.scratch("cyComplexityManagement").options}function h(){var e=o.width(),t=o.height();r.clearRect(0,0,e,t),a=null}function y(e,o,t,n,i){var a=new Image(n,i);a.src=e,a.onload=function(){r.drawImage(a,o,t,n,i)}}o.on("resize",u.eCyResize=function(){c()}),o.on("expandcollapse.clearvisualcue",(function(){a&&h()}));var g=null,x=null;o.on("mousedown",u.eMouseDown=function(e){g=e.renderedPosition||e.cyRenderedPosition}),o.on("mouseup",u.eMouseUp=function(e){x=e.renderedPosition||e.cyRenderedPosition}),o.on("remove","node",u.eRemove=function(e){e.target==a&&h()}),o.on("select unselect",u.eSelect=function(){a&&h();var e=o.nodes(":selected");if(1===e.length){var t=e[0];(n.isExpandable(t)||n.isCollapsible(t))&&function(e){var t,n=e.hasClass("cy-expand-collapse-collapsed-node"),i=p().expandCollapseCueSize,l=p().expandCollapseCueLineSize;if("top-left"===p().expandCollapseCuePosition){var s=o.zoom()<1?i/(2*o.zoom()):i/2,c=parseFloat(e.css("border-width"));t={x:e.position("x")-e.width()/2-parseFloat(e.css("padding-left"))+c+s+1,y:e.position("y")-e.height()/2-parseFloat(e.css("padding-top"))+c+s+1}}else{var u=p().expandCollapseCuePosition;t="function"==typeof u?u.call(this,e):u}var f=d(t),m=((i=Math.max(i,i*o.zoom()))-(l=Math.max(l,l*o.zoom())))/2,v=f.x,h=f.y,g=v-i/2,x=h-i/2,b=i;if(n&&p().expandCueImage)y(p().expandCueImage,g,x,i,i);else if(!n&&p().collapseCueImage)y(p().collapseCueImage,g,x,i,i);else{var E=r.fillStyle,C=r.lineWidth,w=r.strokeStyle;r.fillStyle="black",r.strokeStyle="black",r.ellipse(v,h,i/2,i/2,0,0,2*Math.PI),r.fill(),r.beginPath(),r.strokeStyle="white",r.lineWidth=Math.max(2.6,2.6*o.zoom()),r.moveTo(g+m,x+i/2),r.lineTo(g+l+m,x+i/2),n&&(r.moveTo(g+i/2,x+m),r.lineTo(g+i/2,x+l+m)),r.closePath(),r.stroke(),r.strokeStyle=w,r.fillStyle=E,r.lineWidth=C}e._private.data.expandcollapseRenderedStartX=g,e._private.data.expandcollapseRenderedStartY=x,e._private.data.expandcollapseRenderedCueSize=b,a=e}(t)}}),o.on("tap",u.eTap=function(e){var i=a;if(i){var r=i.data("expandcollapseRenderedStartX"),l=i.data("expandcollapseRenderedStartY"),s=i.data("expandcollapseRenderedCueSize"),d=r+s,c=l+s,u=e.renderedPosition||e.cyRenderedPosition,f=u.x,m=u.y,y=(p().expandCollapseCueSensitivity-1)/2;Math.abs(g.x-x.x)<5&&Math.abs(g.y-x.y)<5&&f>=r-s*y&&f<=d+s*y&&m>=l-s*y&&m<=c+s*y&&(v=t(t({},v),o.options().layout),n.isCollapsible(i)?(h(),n.collapseNodes([i],!0),o.layout(v).run()):n.isExpandable(i)&&(h(),n.expandNodes([i],!0,!0),setTimeout((function(){o.layout(v).run()}),700)))}}),o.on("afterUndo afterRedo",u.eUndoRedo=u.eSelect),o.on("position","node",u.ePosition=m(u.eSelect,100,h)),o.on("pan zoom",u.ePosition),u.hasEventFields=!0,function(e){var t=o.scratch("_cyExpandCollapse");null==t&&(t={}),t.cueUtilities=e,o.scratch("_cyExpandCollapse",t)}(u)},unbind:function(){var e=l();e.hasEventFields?(o.trigger("expandcollapse.clearvisualcue"),o.off("mousedown","node",e.eMouseDown).off("mouseup","node",e.eMouseUp).off("remove","node",e.eRemove).off("tap","node",e.eTap).off("add","node",e.eAdd).off("position","node",e.ePosition).off("pan zoom",e.ePosition).off("select unselect",e.eSelect).off("free","node",e.eFree).off("resize",e.eCyResize).off("afterUndo afterRedo",e.eUndoRedo)):console.log("events to unbind does not exist")},rebind:function(){var e=l();e.hasEventFields?o.on("mousedown","node",e.eMouseDown).on("mouseup","node",e.eMouseUp).on("remove","node",e.eRemove).on("tap","node",e.eTap).on("add","node",e.eAdd).on("position","node",e.ePosition).on("pan zoom",e.ePosition).on("select unselect",e.eSelect).on("free","node",e.eFree).on("resize",e.eCyResize).on("afterUndo afterRedo",e.eUndoRedo):console.log("events to rebind does not exist")}},d=function(e){var t=o.pan(),n=o.zoom();return{x:e.x*n+t.x,y:e.y*n+t.y}};if(s[r])return s[r].apply(o.container(),Array.prototype.slice.call(arguments,1));if("object"==i(r)||!r)return s.init.apply(o.container(),arguments);throw new Error("No such function `"+r+"` for cytoscape.js-expand-collapse")}function y(e){function o(e,o){void 0===e.scratch("cyComplexityManagement")&&e.scratch("cyComplexityManagement",{});var t=e.scratch("cyComplexityManagement");return void 0===o?t:t[o]}function t(e,t,n){o(e)[t]=n}e("core","complexityManagement",(function(e){var n=this,i={filterRule:function(e){return!1},cueEnabled:!0,expandCollapseCuePosition:"top-left",expandCollapseCueSize:12,expandCollapseCueLineSize:8,expandCueImage:void 0,collapseCueImage:void 0,expandCollapseCueSensitivity:1,zIndex:999};if("get"!==e){i=function(e,o){var t={};for(var n in e)t[n]=e[n];for(var n in o)t.hasOwnProperty(n)&&(t[n]=o[n]);return t}(i,e);var a=c(n),r=new Map;t(n,"options",i),t(n,"api",a),t(n,"removedEles",r),h(i,n,a)}return o(n,"api")}))}document.getElementsByName("cbk-flag-display-node-label-pos"),void 0!==window.cytoscape&&y(window.cytoscape);export{y as default};
