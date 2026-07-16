const fs = require('fs');

const file = 'd:/resume  system/client/js/pages/candidate.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add tabs to renderResumeBuilder
const tabsTarget = `<button class="btn btn-ghost btn-xs tab-header-btn" data-tab="education">Education</button>`;
const tabsReplacement = tabsTarget + `
            <button class="btn btn-ghost btn-xs tab-header-btn" data-tab="certifications">Certifications</button>
            <button class="btn btn-ghost btn-xs tab-header-btn" data-tab="languages">Languages</button>
            <button class="btn btn-ghost btn-xs tab-header-btn" data-tab="social">Social Links</button>`;
content = content.replace(tabsTarget, tabsReplacement);

// 2. Add tab content panels
const panelsTarget = `<div class="editor-tab-content" id="tab-content-theme">`;
const panelsReplacement = `
          <div class="editor-tab-content" id="tab-content-certifications">
            <h3 class="mb-4">Certifications</h3>
            <div id="certifications-edit-list" class="flex flex-col gap-3 mb-4">
              ${(parsed.certifications || []).map((cert, i) => \`
                <div class="card p-3 cert-edit-row" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color);">
                  <div class="form-group mb-2"><label class="form-label text-xs">Certification Name</label><input class="form-input cert-name" value="\${cert}"></div>
                  <button class="btn btn-danger btn-xs mt-2 delete-cert-btn">Remove</button>
                </div>
              \`).join('')}
            </div>
            <button class="btn btn-secondary btn-sm w-full" id="add-cert-btn">+ Add Certification</button>
            <button class="btn btn-primary btn-sm mt-4 w-full" id="save-content-cert-btn">Save Progress</button>
          </div>

          <div class="editor-tab-content" id="tab-content-languages">
            <h3 class="mb-4">Languages</h3>
            <div id="languages-edit-list" class="flex flex-col gap-3 mb-4">
              ${(parsed.languages || []).map((lang, i) => \`
                <div class="card p-3 lang-edit-row" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color);">
                  <div class="form-group mb-2"><label class="form-label text-xs">Language</label><input class="form-input lang-name" value="\${lang}"></div>
                  <button class="btn btn-danger btn-xs mt-2 delete-lang-btn">Remove</button>
                </div>
              \`).join('')}
            </div>
            <button class="btn btn-secondary btn-sm w-full" id="add-lang-btn">+ Add Language</button>
            <button class="btn btn-primary btn-sm mt-4 w-full" id="save-content-lang-btn">Save Progress</button>
          </div>

          <div class="editor-tab-content" id="tab-content-social">
            <h3 class="mb-4">Social Links</h3>
            <div id="social-edit-list" class="flex flex-col gap-3 mb-4">
              ${(parsed.socialLinks || []).map((social, i) => \`
                <div class="card p-3 social-edit-row" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color);">
                  <div class="grid grid-2 gap-2 mb-2">
                    <div class="form-group"><label class="form-label text-xs">Platform (e.g. LinkedIn)</label><input class="form-input social-platform" value="\${social.platform}"></div>
                    <div class="form-group"><label class="form-label text-xs">URL</label><input class="form-input social-url" value="\${social.url}"></div>
                  </div>
                  <button class="btn btn-danger btn-xs mt-2 delete-social-btn">Remove</button>
                </div>
              \`).join('')}
            </div>
            <button class="btn btn-secondary btn-sm w-full" id="add-social-btn">+ Add Social Link</button>
            <button class="btn btn-primary btn-sm mt-4 w-full" id="save-content-social-btn">Save Progress</button>
          </div>
` + panelsTarget;
content = content.replace(panelsTarget, panelsReplacement);

// 3. Add to preview renderer
const certsPreview = `
                  if (secId === 'education' && parsed.education?.length) {`;
const certsPreviewReplacement = `
                  if (secId === 'certifications' && parsed.certifications?.length) {
                    return \`
                      <div style="margin-bottom: 16px;">
                        <h3 style="color:\\\${customization.accentColor || '#2563eb'}; margin: 0 0 8px 0; font-size: 1.1rem; text-transform: uppercase;">\\\${getSectionDisplayName('certifications')}</h3>
                        <div style="display:flex; flex-wrap:wrap; gap: 6px;">
                          \\\${parsed.certifications.map(cert => \\\`
                            <span style="font-size: 11px; padding: 4px 8px; border-radius: 4px; background: \\\${customization.accentColor || '#2563eb'}15; color:\\\${customization.accentColor || '#2563eb'}; font-weight:500;">
                              \\\${cert}
                            </span>
                          \\\`).join('')}
                        </div>
                      </div>
                    \`;
                  }
                  if (secId === 'languages' && parsed.languages?.length) {
                    return \`
                      <div style="margin-bottom: 16px;">
                        <h3 style="color:\\\${customization.accentColor || '#2563eb'}; margin: 0 0 8px 0; font-size: 1.1rem; text-transform: uppercase;">\\\${getSectionDisplayName('languages')}</h3>
                        <div style="display:flex; flex-wrap:wrap; gap: 6px;">
                          \\\${parsed.languages.map(lang => \\\`
                            <span style="font-size: 11px; padding: 4px 8px; border-radius: 4px; border: 1px solid \\\${customization.accentColor || '#2563eb'}; color:\\\${customization.accentColor || '#2563eb'}; font-weight:500;">
                              \\\${lang}
                            </span>
                          \\\`).join('')}
                        </div>
                      </div>
                    \`;
                  }
` + certsPreview;
content = content.replace(certsPreview, certsPreviewReplacement);

// 4. Update sectionOrder in renderResumeBuilder if not present
const orderTarget = `const sectionOrder = customization.sectionOrder || ['summary', 'experience', 'skills', 'education'];`;
const orderReplacement = `const sectionOrder = customization.sectionOrder && customization.sectionOrder.length ? customization.sectionOrder : ['summary', 'experience', 'projects', 'skills', 'education', 'certifications', 'languages'];`;
content = content.replace(orderTarget, orderReplacement).replace(orderTarget, orderReplacement);

fs.writeFileSync(file, content);
console.log('Patch 1 applied.');
