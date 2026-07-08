/**
 * Interactive Career Roadmap Visualizer
 */
const RoadmapViz = {
  container: null,
  nodes: [],
  connections: [],
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  dragging: false,
  dragNode: null,

  init(containerId, data) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.nodes = data.nodes || [];
    this.connections = data.connections || [];
    this.render();
    this.bindEvents();
  },

  render() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';

    this.connections.forEach(conn => {
      const from = this.nodes.find(n => n.id === conn.from);
      const to = this.nodes.find(n => n.id === conn.to);
      if (!from || !to) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', from.x + 60);
      line.setAttribute('y1', from.y + 20);
      line.setAttribute('x2', to.x + 60);
      line.setAttribute('y2', to.y + 20);
      line.setAttribute('stroke', '#2563EB');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-dasharray', '6,4');
      line.setAttribute('opacity', '0.4');
      svg.appendChild(line);
    });

    this.container.innerHTML = '';
    this.container.appendChild(svg);

    this.nodes.forEach(node => {
      const el = document.createElement('div');
      el.className = `roadmap-node ${node.completed ? 'completed' : ''} ${node.progress > 0 && !node.completed ? 'active' : ''}`;
      el.style.left = `${node.x}px`;
      el.style.top = `${node.y}px`;
      el.dataset.id = node.id;
      el.innerHTML = `
        <div style="font-size:1.2rem;margin-bottom:4px">${this.typeIcon(node.type)}</div>
        <div>${node.label}</div>
        <div class="progress-bar mt-2" style="height:4px"><div class="progress-fill" style="width:${node.progress || 0}%"></div></div>
        <div class="text-xs text-muted mt-1">${node.progress || 0}%</div>`;
      this.container.appendChild(el);
    });
  },

  typeIcon(type) {
    const icons = { skill: '⚡', project: '🚀', company: '🏢', certification: '📜', achievement: '🏆', experience: '💼', goal: '🎯' };
    return icons[type] || '●';
  },

  bindEvents() {
    this.container?.querySelectorAll('.roadmap-node').forEach(node => {
      node.addEventListener('mousedown', (e) => {
        this.dragging = true;
        this.dragNode = node;
        this.startX = e.clientX - parseInt(node.style.left);
        this.startY = e.clientY - parseInt(node.style.top);
      });
    });

    if (this._mousemoveHandler) {
      document.removeEventListener('mousemove', this._mousemoveHandler);
    }
    if (this._mouseupHandler) {
      document.removeEventListener('mouseup', this._mouseupHandler);
    }

    this._mousemoveHandler = (e) => {
      if (!this.dragging || !this.dragNode) return;
      this.dragNode.style.left = `${e.clientX - this.startX}px`;
      this.dragNode.style.top = `${e.clientY - this.startY}px`;
      const id = this.dragNode.dataset.id;
      const n = this.nodes.find(n => n.id === id);
      if (n) { n.x = parseInt(this.dragNode.style.left); n.y = parseInt(this.dragNode.style.top); }
      this.render();
    };

    this._mouseupHandler = () => {
      if (this.dragging) {
        this.dragging = false;
        this.dragNode = null;
        const onUpdate = this.container?.dataset.onUpdate;
        if (onUpdate && window[RoadmapViz.container?.dataset.callback]) {
          window[RoadmapViz.container.dataset.callback](this.nodes);
        }
      }
    };

    document.addEventListener('mousemove', this._mousemoveHandler);
    document.addEventListener('mouseup', this._mouseupHandler);
  }
};
