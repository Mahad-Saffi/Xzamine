document.addEventListener('DOMContentLoaded', () => {
    const resultsDiv = document.getElementById('results');
    const clearButton = document.getElementById('clear-history');
  
    const createProbabilityBars = (probabilities) => {
      return Object.entries(probabilities)
        .sort(([, a], [, b]) => b - a)
        .map(([label, value]) => `
          <div class="probability-item">
            <div class="probability-label">${label}</div>
            <div class="probability-bar">
              <div class="probability-fill" style="width: ${(value * 100).toFixed(1)}%"></div>
            </div>
            <div class="probability-value">${(value * 100).toFixed(1)}%</div>
          </div>
        `).join('');
    };
  
    const createExpandableSection = (title, content) => {
      return `
        <div class="detail-item">
          <div class="detail-title">${title}</div>
          <details>
            <summary>Show More</summary>
            <div class="detail-content">${content}</div>
          </details>
        </div>
      `;
    };
  
    const loadAnalyses = () => {
      chrome.storage.local.get(null, (items) => {
        resultsDiv.innerHTML = '';
  
        Object.entries(items).sort((a, b) => b[0].localeCompare(a[0]))
          .forEach(([taskId, data]) => {
            const postDiv = document.createElement('div');
            postDiv.className = 'analysis-section';
  
            const analysis = data.detailed_analysis || {};
            const probabilities = analysis.probabilities || {};
            const sentimentClass = data.sentiment === 'Warning'
              ? 'sentiment-warning'
              : 'sentiment-normal';
  
            postDiv.innerHTML = `
              <div class="section-header">
                <div><strong>Post Analysis</strong></div>
                <div class="sentiment-indicator ${sentimentClass}">${data.sentiment}</div>
              </div>
  
              <div class="detail-item">
                <div class="detail-title">Original Post</div>
                <div class="detail-content">${data.post}</div>
              </div>
  
              <div class="probability-grid">
                ${createProbabilityBars(probabilities)}
              </div>
  
              <div class="detail-item">
                <div class="detail-title">Confidence Score</div>
                <div class="detail-content">${(analysis.confidence_score || 0).toFixed(2)}</div>
              </div>
  
              <div class="detail-item">
                <div class="detail-title">Toxic Score</div>
                <div class="detail-content">${(analysis.toxic_score || 0).toFixed(2)}</div>
              </div>
  
              <div class="detail-card cultural-context">
                <div class="detail-title">Cultural Context</div>
                <div class="detail-content">${analysis.cultural_context || 'No context available'}</div>
              </div>
  
              <div class="detail-card legal-definition">
                <div class="detail-title">Legal Definition</div>
                <div class="detail-content">${analysis.legal_definition || 'No legal definition available'}</div>
              </div>
  
              <div class="detail-card protected-group">
                <div class="detail-title">Protected Group Analysis</div>
                <div class="detail-content">${analysis.protected_group_analysis || 'No group analysis available'}</div>
              </div>
  
              ${createExpandableSection('Rationale', analysis.rationale || 'No rationale available')}
            `;
  
            resultsDiv.appendChild(postDiv);
          });
  
          clearButton.disabled = Object.keys(items).length === 0;
      });
    };
  
    clearButton.addEventListener('click', () => {
      chrome.storage.local.clear(() => {
        resultsDiv.innerHTML = '<div class="loading">History cleared</div>';
        setTimeout(loadAnalyses, 1000);
      });
    });
  
    loadAnalyses();
  });
  