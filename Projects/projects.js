import { fetchJSON, renderProjects } from '../global.js';

async function init() {
  const projects = await fetchJSON('../lib/projects.json');
  const projectsContainer = document.querySelector('.projects');
  
  if (projectsContainer && projects) {
    renderProjects(projects, projectsContainer, 'h2');
    
    // Update count in heading
    const titleElement = document.querySelector('.projects-title');
    if (titleElement) {
      titleElement.textContent = `${projects.length} Projects`;
    }
  }
}

init();
