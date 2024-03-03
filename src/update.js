/*!
 *
 * Copyright 2022 Square Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */


// duplicating colors here in the order which would make the sources more distinct
let _schema_idx_colors = {
  steelblue: 0x4682b4,
  salmon: 0xfa8072,
  darkgreen: 0x006400,
  darkred: 0x8b0000,
  magenta: 0xff00ff,
  darkgray: 0xa9a9a9,
  limegreen: 0x32cd32,
  peru: 0xcd853f,
  red: 0xff0000,
  purple: 0x800080,
  paleturquoise: 0xafeeee,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lightgoldenrodyellow: 0xfafad2,
  lime: 0x00ff00,
  linen: 0xfaf0e6,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  rebeccapurple: 0x663399,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
};


// source refers to the ancestor node that this node is
// currently entering from
export function _update(source) {
  const {
    animationDuration,
    parentNodeTextOrientation,
    childNodeTextOrientation,
    openNodeCircleColor,
    closedNodeCircleColor,
    maxDepthNodeColor,
    cyclicNodeColor,
    missingNodeColor,
    horizontalSpaceBetweenNodes,
    textStyleColor,
    textStyleFont,
    circleStrokeColor,
    circleStrokeWidth,
    circleSize,
    linkStrokeColor,
    linkStrokeWidth,
    wrapNodeName,
    enableTooltip,
    modifyEntityName,
    textClick,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight
  } = this.options;

  const boundClick = this._click.bind(this);
  this.treeData = this.treeMap(this.root);

  // Tree data descendants gets all the nodes that are visible on the page.
  // specifically the data objects, not the actual node elements. If the
  // node element has not previously been on the page yet, the data object
  // won't exist on this list. It's important to note that none of these
  // are SVGs yet, just objects in memory. Each node has a _children,
  // .children, and a data.children. The former two are specific to the
  // visual node object, the latter is a part of the data object (that stays
  // static). These objects are the same. Even on each new treeData
  // variable, the objects are consistent. The object structure is as follows
  // node = { entityDataObj, x, y, 0x, 0y ..otherCoordinatesAndVisualData }

  // This code below computes the layout.
  const nodes = this.treeData.descendants();
  const links = this.treeData.descendants().slice(1);

  // Normalize for fixed-depth.
  nodes.forEach(d => {
    const fixedDepth = d.depth * horizontalSpaceBetweenNodes;
    // by inverting the y coordinate, we create our upstream (left to right) tree
    d.y = this.direction === 'upstream' ? this.width - fixedDepth : fixedDepth;
    if (!d.dx) { d.dx = source.x0; }
    if (!d.dy) { d.dy = source.y0; }
  });

  // calculates the height of the tree based on the position
  // of the leftmost and rightmost nodes
  let nodeLeft = this.root;
  let nodeRight = this.root;
  this.root.eachBefore(node => {
    if (node.x < nodeLeft.x) {nodeLeft = node;}
    if (node.x > nodeRight.x) {nodeRight = node;}
  });
  const height = nodeRight.x - nodeLeft.x + marginTop + marginBottom;

  const transition = this.svg.transition()
    .duration(animationDuration)
    // dynamically sets the height of the svg based on how many nodes there are to display
    .attr('viewBox', [-marginLeft, nodeLeft.x - marginTop, this.width + marginLeft + marginRight, height])
    .tween('resize', window.ResizeObserver ? null : () => () => this.svg.dispatch('toggle'));


  // ****************** Nodes section ***************************

  // Update the nodes...
  const node = this.svg
    .selectAll('g.node')
    .data(nodes, d => d.id || (d.id = ++this.nodeId));

  // Enter any new nodes at the source's previous position.
  const nodeEnter = node
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', () => `translate(${source.y0},${source.x0})`)
    .attr('cursor', 'pointer');

  // Add Circle for the nodes
  nodeEnter
    .append('circle')
    .on('click', boundClick)
    .attr('r', 1e-6)
    .style('stroke', d => {
      // abnormal nodes don't have a circle border
      // so we just fill this color with the same
      // color creating a solid dot
      if (d.data['Automated Note']) {
        if (d.data._maxDepth) {
          return maxDepthNodeColor;
        } else if (d.data._cyclic) {
          return cyclicNodeColor;
        } else if (d.data._missing) {
          return missingNodeColor;
        }
      }
      let _schema = d.data._schema;
      if (_schema !== undefined) {
            return Object.keys(_schema_idx_colors)[d.data._schema_idx];
      }
      else {return circleStrokeColor} ;
    })
    .style('stroke-width', `${circleStrokeWidth}px`)
    .style('fill', d => {
      if (d.data['Automated Note']) {
        if (d.data._maxDepth) {
          return maxDepthNodeColor;
        } else if (d.data._cyclic) {
          return cyclicNodeColor;
        } else if (d.data._missing) {
          return missingNodeColor;
        }
        return circleStrokeColor;
      }
      return d._children ? closedNodeCircleColor : openNodeCircleColor;
    });

  // handle user options orientation
  const parent = this._getTextDirection(parentNodeTextOrientation);
  const child = this._getTextDirection(childNodeTextOrientation);

  const text = nodeEnter
    .append('text')
    .attr('dy', '.35em')
    .attr('x', d =>
      d.children || d._children ? parent.offset : child.offset,
    )
    .attr('text-anchor', d =>
      d.children || d._children ? parent.orientation : child.orientation,
    )
    .attr('fill', textStyleColor)
    .text(d => this._filterScriptInjection(modifyEntityName ? modifyEntityName(d.data) : d.data._name))
    .style('fill-opacity', 1e-6)
    .style('font', textStyleFont)
    .on('click', boundClick);

  if (textClick) {
    text.on('click', (event, node) => textClick(event, node.data));
  }

  if (wrapNodeName) {
    text.call(this._wrap, horizontalSpaceBetweenNodes * 0.75, this.options.splitStr);
  }

  const nodeUpdate = nodeEnter.merge(node);

  nodeUpdate
    .transition(transition)
    .duration(animationDuration)
    .attr('transform', d => `translate(${d.y}, ${d.x})`);

  nodeUpdate
    .select('circle')
    .attr('r', circleSize)
    .style('fill', d => {
      if (d.data['Automated Note']) {
        if (d.data._maxDepth) {
          return maxDepthNodeColor;
        } else if (d.data._cyclic) {
          return cyclicNodeColor;
        } else if (d.data._missing) {
          return missingNodeColor;
        } else {
          return circleStrokeColor;
        }
      }
      return d._children ? closedNodeCircleColor : openNodeCircleColor;
    });

    nodeUpdate.select('text').style('fill-opacity', 1)

  if (enableTooltip) {
    nodeUpdate
      .on('mouseover', this._mouseover.bind(this))
      .on('mousemove', this._mousemove.bind(this))
      .on('mouseout', this._mouseout.bind(this));
  }

  const nodeExit = node
    .exit()
    .transition(transition)
    .duration(animationDuration)
    .attr('transform', () => `translate(${source.y},${source.x})`)
    .remove();

  // On exit reduce the node circles size to 0
  nodeExit.select('circle').attr('r', 1e-6);

  // On exit reduce the opacity of text labels
  nodeExit.select('text').style('fill-opacity', 1e-6);


  // ****************** links section ***************************

  // Update the links...
  const link = this.svg.selectAll('path').data(links, d => d.id);

  // Enter any new links at the source's previous position.
  const linkEnter = link
    .enter()
    .insert('path', 'g')
    .attr('d', d => {
      const o = { x: source.x0, y: source.y0 };
      return this._diagonal(o, o);
    })
    .style('fill', 'none')
    .style('stroke', linkStrokeColor)
    .style('stroke-width', `${linkStrokeWidth}px`);

  const linkUpdate = linkEnter.merge(link);

  // Transition back to the parent element position
  linkUpdate
    .transition(transition)
    .duration(animationDuration)
    .attr('d', d => {
      return this._diagonal(d, d.parent);
    });

  // Remove any exiting links
  link
    .exit()
    .transition(transition)
    .duration(animationDuration)
    .attr('d', d => {
      const o = { x: source.x, y: source.y };
      return this._diagonal(o, o);
    })
    .remove();


  // Store the old positions of each node for transition.
  nodes.forEach(d => {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}
