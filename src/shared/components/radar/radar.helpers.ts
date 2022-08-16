// The MIT License (MIT)

// Copyright (c) 2017 Zalando SE

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import { Selection, select, forceSimulation, forceCollide, arc, pie } from 'd3';
import { color } from '../../../theme';
import {
  bounded_box,
  bounded_ring,
  cartesian,
  normal_between,
  polar,
  random_between,
  translate,
} from '../../utils/radarUtils';
import { RadarQuadrant, RadarRing, RadarTechnology, Rings } from './radar.types';

const quadrantData = (count: number) => {
  const isEven = count % 2 === 0;

  return [...Array(count).keys()].map((i) => {
    let factor_x = 0;

    if (isEven) {
      factor_x = i < count / 2 ? 1 : -1;
    } else {
      factor_x = i < count / 2 - 1 ? 1 : -1;

      if (i === count / 2 - 1) {
        factor_x = 0;
      }
    }

    return {
      factor_x,
      position: (360.0 / count) * (i - 1),
      quadrant: i,
    };
  });
};

type RenderGrid = {
  radar: Selection<SVGGElement, unknown, null, undefined>;
  scale: number;
  rings: Rings;
  quadrantCount: number;
};

export const renderGrid = ({ radar, scale, rings, quadrantCount }: RenderGrid) => {
  const grid = radar.append('g');

  const defs = grid.append('defs');
  const filter = defs.append('filter').attr('x', 0).attr('y', 0).attr('width', 1).attr('height', 1).attr('id', 'solid');
  filter.append('feFlood').attr('flood-color', 'rgb(0, 0, 0, 0.8)');
  filter.append('feComposite').attr('in', 'SourceGraphic');

  const ringGradient = defs.append('radialGradient').attr('id', 'ringGradient');
  ringGradient.append('stop').attr('offset', '60%').attr('stop-color', 'transparent').attr('stop-opacity', 1);
  ringGradient.append('stop').attr('offset', '85%').attr('stop-color', 'transparent').attr('stop-opacity', 0.8);
  ringGradient
    .append('stop')
    .attr('offset', '100%')
    .attr('stop-color', color.nanogiantsBlue)
    .attr('stop-opacity', 0.05);

  for (let i = 0; i < rings.length; i++) {
    grid
      .append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', rings[i].radius)
      .style('fill', 'url(#ringGradient)')
      .style('stroke', color.mineShaft)
      .style('stroke-width', 2);
  }

  const alpha = 360.0 / quadrantCount;
  const radius = 450 * scale;

  for (let i = 0; i < quadrantCount; i++) {
    const x1 = radius * Math.sin((i * alpha * Math.PI) / 180);
    const x2 = 0;
    const y1 = -radius * Math.cos((i * alpha * Math.PI) / 180);
    const y2 = 0;

    grid
      .append('line')
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2)
      .style('stroke', color.mineShaft)
      .style('stroke-width', 2);
  }

  return grid;
};

type RenderQuadrantSectors = {
  radar: Selection<SVGGElement, unknown, null, undefined>;
  rings: Rings;
  quadrants: RadarQuadrant[];
};

// still broken
export const renderQuadrantSectors = ({ radar, rings, quadrants }: RenderQuadrantSectors) => {
  const quadrantsContainer = radar.append('g').attr('id', 'quadrants');
  const defs = radar.select('defs');
  const semiCircle = radar.select('defs').append('clipPath').attr('id', 'semi-circle');
  // semiCircle
  //   .append('rect')
  //   .attr('x', -rings[3].radius)
  //   .attr('y', 0)
  //   .attr('width', rings[3].radius / 2)
  //   .attr('height', rings[3].radius / 2);
  semiCircle
    .append('arc')
    .attr('x', 0)
    .attr('y', 0)
    .attr('innerRadius', 0)
    .attr('outerRadius', rings[3].radius)
    .attr('startAngle', 0)
    .attr('endAngle', (2 * Math.PI) / quadrants.length);

  console.log('hfdjsk', semiCircle);

  const conicGradient = defs.append('linearGradient').attr('id', 'conic-gradient');
  conicGradient.attr('x1', '0%').attr('y1', '100%').attr('x2', '100%').attr('y2', '0%');
  conicGradient.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(255, 0, 0, 1)').attr('stop-opacity', 0.9);
  conicGradient.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(0, 0, 0, 0)').attr('stop-opacity', 1);

  const quadrantSectors = quadrantsContainer
    .selectAll('.quadrant-circle')
    .data(quadrantData(quadrants.length))
    .enter()
    .append('g')
    .attr('class', 'quadrant')
    .attr('id', (d) => `quadrant-${d.quadrant}`);

  quadrantSectors
    .append('circle')
    .attr('class', 'quadrant-circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', rings[3].radius)
    .attr('clip-path', 'url(#semi-circle)')
    // .attr('transform', (d) => `rotate(${d.position})`)
    .attr('fill', 'url(#conic-gradient)');

  return quadrantSectors;
};

type RenderAreaLabels = {
  areaLabelsContainer: Selection<SVGGElement, unknown, null, undefined>;
  quadrants: RadarQuadrant[];
  rings: Rings;
};

export const renderAreaLabels = ({ areaLabelsContainer, rings, quadrants }: RenderAreaLabels) => {
  const areaLabel = areaLabelsContainer
    .selectAll('.area-label')
    .data(quadrantData(quadrants.length))
    .enter()
    .append('g')
    .attr('class', 'area-label')
    .attr('id', (d) => `area-label-${d.quadrant}`);

  const alpha = 360.0 / (quadrants.length * 2);
  const radius = rings[3].radius;

  const getFactors = (i: number) => {
    const isEven = quadrants.length % 2 === 1;
    let align = i <= (quadrants.length - 2) / 2 ? 'start' : 'end';
    if (isEven && i === (quadrants.length - 1) / 2) {
      align = 'middle';
    }

    return {
      x: radius * Math.sin(((2 * i + 1) * alpha * Math.PI) / 180),
      y: -radius * Math.cos(((2 * i + 1) * alpha * Math.PI) / 180),
      align,
    };
  };

  const rect = areaLabel.append('rect').attr('rx', 15).attr('ry', 15);
  const text = areaLabel
    .append('text')
    .attr('x', (d) => getFactors(d.quadrant).x)
    .attr('y', (d) => getFactors(d.quadrant).y)
    .attr('text-anchor', (d) => getFactors(d.quadrant).align)
    .style('font-family', 'SharpGroteskBook19')
    .style('font-size', '13px')
    .style('font-weight', 600)
    .style('letter-spacing', '0.2em')
    .text((d) => quadrants[d.quadrant]?.name?.toUpperCase());

  const textNodes = text.nodes();
  const getSize = (index: number) => textNodes[index].getBBox();

  rect
    .attr('x', (d) => {
      const factors = getFactors(d.quadrant);
      return factors.x - 15 - getSize(d.quadrant).width * 0.5 * ['start', 'middle', 'end'].indexOf(factors.align);
    })
    .attr('y', (d) => getFactors(d.quadrant).y - getSize(d.quadrant).height - 6)
    .attr('width', (d) => getSize(d.quadrant).width + 30)
    .attr('height', 32);

  return areaLabel;
};

type RenderRinkLabels = {
  ringLabelsContainer: Selection<SVGGElement, unknown, null, undefined>;
  quadrants: RadarQuadrant[];
  rings: Rings;
  radarRings: RadarRing[];
};

export const renderRingLabels = ({ ringLabelsContainer, rings, radarRings }: RenderRinkLabels) => {
  return ringLabelsContainer
    .append('g')
    .attr('id', 'ring-labels')
    .selectAll('.ring-label')
    .data(rings)
    .enter()
    .append('text')
    .classed('ring-label', true)
    .text((d, i) => radarRings[i]?.name)
    .attr('y', (d) => -d.radius + 21)
    .attr('x', 7)
    .attr('text-anchor', 'left')
    .style('font-family', 'SharpGroteskBook19')
    .style('color', color.nanogiantsDarkBlue)
    .style('font-size', 14);
};

type RenderTechnologies = {
  radar: Selection<SVGGElement, unknown, null, undefined>;
  technologies: RadarTechnology[];
  rings: Rings;
  quadrants: RadarQuadrant[];
};

export const renderTechnologies = ({ radar, technologies, rings, quadrants }: RenderTechnologies) => {
  function getSegment(quadrant: number, ring: number) {
    const singleSegment = (2 * Math.PI) / quadrants.length;
    const halfSegment = singleSegment / 2;

    const minAlpha = ((2 * Math.PI) / quadrants.length) * quadrant - singleSegment - halfSegment;
    const maxAlpha = ((2 * Math.PI) / quadrants.length) * quadrant - singleSegment + halfSegment;
    const alpha = random_between(minAlpha + singleSegment / 5, maxAlpha - singleSegment / 5);

    const minRadius = ring === 0 ? 0 : rings[ring - 1].radius;
    const maxRadius = rings[ring].radius;
    const radius = normal_between(minRadius + 10, maxRadius - 35);

    const point = cartesian({ r: radius, t: alpha });

    return {
      clipx: function (d: any) {
        const p = bounded_ring(
          polar(d),
          minRadius + 10,
          maxRadius - 35,
          minAlpha + singleSegment / 10,
          maxAlpha - singleSegment / 10
        );
        d.x = cartesian(p).x;
        return d.x;
      },
      clipy: function (d: any) {
        const p = bounded_ring(
          polar(d),
          minRadius + 10,
          maxRadius - 35,
          minAlpha + singleSegment / 10,
          maxAlpha - singleSegment / 10
        );
        d.y = cartesian(p).y;
        return d.y;
      },
      random: function () {
        return point;
      },
    };
  }

  const formattedTechnologies = technologies.map((technology) => {
    const segment = getSegment(technology.quadrant, technology.ring);
    return { ...technology, segment, ...segment.random(), color: technology.inactive ? color.mineShaft : color.silver };
  });

  const segmented = new Array(quadrants.length);
  for (let quadrant = 0; quadrant < quadrants.length; quadrant++) {
    segmented[quadrant] = new Array(4);
    for (let ring = 0; ring < 4; ring++) {
      segmented[quadrant][ring] = [];
    }
  }
  for (let i = 0; i < formattedTechnologies.length; i++) {
    const technology = formattedTechnologies[i];
    segmented[technology.quadrant][technology.ring].push(technology);
  }

  const rink = radar.append('g').attr('id', 'rink');

  const blips = rink
    .selectAll('.blip')
    .data(formattedTechnologies)
    .enter()
    .append('g')
    .attr('class', 'blip')
    .attr('id', (d) => `blip-${d.id}`)
    .style('cursor', (d) => (d.description ? 'pointer' : 'default'))
    .attr('transform', (d) => {
      const x = d.x;
      const y = d.y;

      return `translate(${x}, ${y})`;
    });

  const blipsInner = blips.append('g').attr('class', 'blip-inner');

  blipsInner.each(function (d) {
    const blip = select(this);
    blip.style('opacity', 0).transition().duration(700).style('opacity', 1);

    const blipDefs = blip.append('defs');

    const mainGradient = blipDefs.append('linearGradient').attr('id', 'mainGradient');
    mainGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', color.nanogiantsDarkRed)
      .attr('stop-opacity', 1);
    mainGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', color.nanogiantsDarkRed)
      .attr('stop-opacity', 1);

    const diamondMainGradient = blipDefs.append('linearGradient').attr('id', 'diamondMainGradient');
    diamondMainGradient.attr('x1', '0%').attr('y1', '100%').attr('x2', '100%').attr('y2', '0%');
    diamondMainGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', color.nanogiantsDarkRed)
      .attr('stop-opacity', 1);
    diamondMainGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', color.nanogiantsDarkRed)
      .attr('stop-opacity', 1);

    if (d.ring === 0) {
      blip.append('circle').classed('outer', true).attr('r', 9).attr('fill', color.nanogiantsDarkRed);
      blip.append('circle').classed('circle', true).attr('r', 4.5);
    } else if (d.ring === 1) {
      blip
        .append('rect')
        .classed('outer', true)
        .attr('x', -7.4)
        .attr('y', -7.4)
        .attr('width', 14.8)
        .attr('height', 14.8)
        .attr('transform', 'rotate(45)')
        .attr('fill', color.nanogiantsDarkRed);

      blip
        .append('rect')
        .classed('diamond', true)
        .attr('x', -4.5)
        .attr('y', -4.5)
        .attr('width', 9)
        .attr('height', 9)
        .attr('transform', 'rotate(45)');
    } else if (d.ring === 2) {
      blip
        .append('rect')
        .classed('outer', true)
        .attr('x', -7.4)
        .attr('y', -7.4)
        .attr('width', 14.8)
        .attr('height', 14.8)
        .attr('fill', 'url(#mainGradient)');

      blip.append('rect').classed('square', true).attr('x', -4.5).attr('y', -4.5).attr('width', 9).attr('height', 9);
    } else {
      blip
        .append('path')
        .classed('outer', true)
        .attr('d', 'M 12.5 4.999 L -0.0003 -13 L -12.5 5 L 12.5 4.999 Z')
        .style('transform', 'scale(0.9)')
        .attr('fill', 'url(#mainGradient)');

      blip
        .append('path')
        .classed('triangle', true)
        .attr('d', 'M 12.5 3.999 L -0.0003 -14 L -12.5 4 L 12.5 3.999 Z')
        .style('transform', 'scale(0.5)');
    }
  });

  function ticked() {
    blips.attr('transform', function (d) {
      const translateData = { x: d.segment.clipx(d), y: d.segment.clipy(d) };
      const blip = select(this);
      blip.attr('data-translate', JSON.stringify(translateData));
      return translate(translateData);
    });
  }

  forceSimulation()
    .alphaMin(0.00001)
    .nodes(formattedTechnologies)
    .velocityDecay(0.19)
    .force('collision', forceCollide().radius(12).strength(0.01))
    .on('tick', ticked);

  return blips;
};

export const renderBubble = (bubbleContainer: Selection<SVGGElement, unknown, null, undefined>) => {
  console.log('fhdukfhdjk');

  const bubble = bubbleContainer
    .append('g')
    .attr('id', 'bubble')
    .attr('x', 0)
    .attr('y', 0)
    .style('opacity', 0)
    .style('pointer-events', 'none')
    .style('user-select', 'none');
  bubble.append('rect').attr('rx', 6).attr('ry', 6).style('fill', color.black);
  bubble
    .append('text')
    .style('font-family', 'SharpGroteskBook19')
    .style('font-size', '12px')
    .style('font-weight', '700')
    .style('fill', color.nanogiantsDarkRed);
};

export const showTooltip = (target: Element, text: string, factorX: number, arrowTop?: number) => {
  const leftPlacement = factorX === 1;
  const { x, y, width, height } = target.getBoundingClientRect();

  console.log('x,', x, y, target);

  const tooltipContainer = select('.tooltip-container')
    .classed('show', true)
    .style('height', `${height}px`)
    .style('top', `${y}px`)
    .style('left', leftPlacement ? `${x - 20}px` : `${x + width + 20}px`)
    .style('transform', `translateX(${leftPlacement ? '-100%' : '0%'})`);

  tooltipContainer.select('p').text(text);

  tooltipContainer
    .select('.tooltip-arrow')
    .style('left', leftPlacement ? 'auto' : '-9px')
    .style('right', leftPlacement ? '-9px' : 'auto')
    .style('top', typeof arrowTop === 'number' ? arrowTop : `${height / 4}px`);
};

export const hideTooltip = () => {
  select('.tooltip-container').classed('show', false);
};
