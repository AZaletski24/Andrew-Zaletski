import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let projects = [];
let query = '';
let selectedLabel = null;

const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');

function getQueryFiltered() {
  return projects.filter(project => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

function getVisibleProjects() {
  let qFiltered = getQueryFiltered();
  if (selectedLabel === null) return qFiltered;
  return qFiltered.filter(p => String(p.year) === selectedLabel);
}

function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  let data = rolledData.map(([year, count]) => ({
    value: count,
    label: String(year),
  }));

  let colors = d3.scaleOrdinal(d3.schemeTableau10);
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));

  let selectedIndex = selectedLabel === null
    ? -1
    : data.findIndex(d => d.label === selectedLabel);

  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  function updateSelection(newIndex) {
    selectedLabel = newIndex === -1 ? null : data[newIndex].label;

    svg.selectAll('path')
      .attr('class', (_, idx) => idx === newIndex ? 'selected' : '');

    legend.selectAll('li')
      .attr('class', (_, idx) =>
        `legend-item${idx === newIndex ? ' selected' : ''}`
      );

    renderProjects(getVisibleProjects(), projectsContainer, 'h2');
  }

  arcs.forEach((arc, i) => {
    svg.append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => {
        let newIdx = selectedLabel === data[i].label ? -1 : i;
        updateSelection(newIdx);
      });
  });

  data.forEach((d, idx) => {
    legend.append('li')
      .attr('class', `legend-item${idx === selectedIndex ? ' selected' : ''}`)
      .attr('style', `--color:${colors(idx)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        let newIdx = selectedLabel === d.label ? -1 : idx;
        updateSelection(newIdx);
      });
  });
}

async function init() {
  projects = await fetchJSON('../lib/projects.json');
  if (!projects) return;

  const titleElement = document.querySelector('.projects-title');
  if (titleElement) {
    titleElement.textContent = `${projects.length} Projects`;
  }

  renderProjects(projects, projectsContainer, 'h2');
  renderPieChart(projects);
}

searchInput?.addEventListener('input', (event) => {
  query = event.target.value;
  let filtered = getQueryFiltered();
  renderProjects(getVisibleProjects(), projectsContainer, 'h2');
  renderPieChart(filtered);
});

init();
