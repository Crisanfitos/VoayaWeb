/**
 * AI Monitoring Server
 * Serves a real-time dashboard showing the status of all AI models
 * Runs on a separate port (3002) from the main server
 */

import http from 'http';
import { aiRouter } from './ai-router.service';
import { modelHealth } from './model-health';
import { modelsConfig } from './models-config';

const MONITORING_PORT = 3002;

/**
 * Generate the HTML dashboard
 */
function generateDashboardHTML(): string {
    const status = aiRouter.getModelsStatus();
    const summary = status.summary;
    const healthMap = new Map(status.health.map(h => [`${h.provider}:${h.modelId}`, h]));

    // Generate table rows for each model
    const generateModelRows = (provider: string, models: { id: string }[]) => {
        return models.map(model => {
            const health = healthMap.get(`${provider}:${model.id}`);
            const statusEmoji = health?.status === 'disabled' ? '🔴'
                : health?.status === 'degraded' ? '🟡'
                    : '🟢';
            const statusClass = health?.status || 'available';

            return `
                <tr class="model-row ${statusClass}">
                    <td><span class="provider-badge ${provider}">${provider}</span></td>
                    <td class="model-name">${model.id}</td>
                    <td class="status-cell">${statusEmoji} ${health?.status || 'available'}</td>
                    <td class="error-light">${health?.errors.light || 0}</td>
                    <td class="error-medium">${health?.errors.medium || 0}</td>
                    <td class="error-severe">${health?.errors.severe || 0}</td>
                    <td>${health?.totalCalls || 0}</td>
                    <td>${health?.successfulCalls || 0}</td>
                    <td class="last-error">${health?.lastError ? `${health.lastError.code}: ${health.lastError.message.slice(0, 50)}` : '-'}</td>
                </tr>
            `;
        }).join('');
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="5">
    <title>Voaya AI Monitoring Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
            color: #e0e0e0;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1800px;
            margin: 0 auto;
        }
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px 30px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        h1 {
            font-size: 1.8rem;
            font-weight: 700;
            background: linear-gradient(90deg, #00d4ff, #7c3aed);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .refresh-info {
            color: #888;
            font-size: 0.9rem;
        }
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 30px;
        }
        .card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
        }
        .card-value {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 5px;
        }
        .card-label {
            color: #888;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .card.available .card-value { color: #22c55e; }
        .card.degraded .card-value { color: #f59e0b; }
        .card.disabled .card-value { color: #ef4444; }
        .card.total .card-value { color: #00d4ff; }
        .card.errors .card-value { color: #f87171; }
        
        .providers-status {
            display: flex;
            gap: 16px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        .provider-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .provider-card.active { border-color: #22c55e; }
        .provider-card.inactive { border-color: #ef4444; opacity: 0.5; }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 12px;
            overflow: hidden;
        }
        th {
            background: rgba(255, 255, 255, 0.08);
            padding: 14px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #aaa;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 0.9rem;
        }
        .model-row:hover {
            background: rgba(255, 255, 255, 0.05);
        }
        .model-row.disabled {
            opacity: 0.5;
            background: rgba(239, 68, 68, 0.1);
        }
        .model-row.degraded {
            background: rgba(245, 158, 11, 0.1);
        }
        .provider-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        .provider-badge.gemini { background: #4285f4; color: white; }
        .provider-badge.groq { background: #7c3aed; color: white; }
        .provider-badge.cerebras { background: #06b6d4; color: white; }
        .provider-badge.openrouter { background: #f59e0b; color: black; }
        
        .model-name {
            font-family: 'SF Mono', Consolas, monospace;
            font-size: 0.85rem;
        }
        .status-cell { text-transform: uppercase; font-weight: 600; }
        .error-light { color: #22c55e; }
        .error-medium { color: #f59e0b; }
        .error-severe { color: #ef4444; font-weight: 700; }
        .last-error {
            color: #888;
            font-size: 0.8rem;
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .timestamp {
            text-align: center;
            color: #666;
            margin-top: 20px;
            font-size: 0.85rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🚀 Voaya AI Monitoring</h1>
            <span class="refresh-info">Auto-refresh every 5 seconds</span>
        </header>

        <div class="summary-cards">
            <div class="card total">
                <div class="card-value">${summary.total || Object.values(modelsConfig).reduce((sum, p) => sum + p.models.length, 0)}</div>
                <div class="card-label">Total Models</div>
            </div>
            <div class="card available">
                <div class="card-value">${summary.available}</div>
                <div class="card-label">Available</div>
            </div>
            <div class="card degraded">
                <div class="card-value">${summary.degraded}</div>
                <div class="card-label">Degraded</div>
            </div>
            <div class="card disabled">
                <div class="card-value">${summary.disabled}</div>
                <div class="card-label">Disabled</div>
            </div>
            <div class="card total">
                <div class="card-value">${summary.totalCalls}</div>
                <div class="card-label">Total Calls</div>
            </div>
            <div class="card errors">
                <div class="card-value">${summary.totalErrors}</div>
                <div class="card-label">Total Errors</div>
            </div>
        </div>

        <div class="providers-status">
            <div class="provider-card ${status.providers.gemini ? 'active' : 'inactive'}">
                <span class="provider-badge gemini">Gemini</span>
                ${status.providers.gemini ? '✓ Active' : '✗ No API Key'}
            </div>
            <div class="provider-card ${status.providers.groq ? 'active' : 'inactive'}">
                <span class="provider-badge groq">Groq</span>
                ${status.providers.groq ? '✓ Active' : '✗ No API Key'}
            </div>
            <div class="provider-card ${status.providers.cerebras ? 'active' : 'inactive'}">
                <span class="provider-badge cerebras">Cerebras</span>
                ${status.providers.cerebras ? '✓ Active' : '✗ No API Key'}
            </div>
            <div class="provider-card ${status.providers.openrouter ? 'active' : 'inactive'}">
                <span class="provider-badge openrouter">OpenRouter</span>
                ${status.providers.openrouter ? '✓ Active' : '✗ No API Key'}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Provider</th>
                    <th>Model ID</th>
                    <th>Status</th>
                    <th>Light (429)</th>
                    <th>Medium (5xx)</th>
                    <th>Severe (404)</th>
                    <th>Total Calls</th>
                    <th>Successful</th>
                    <th>Last Error</th>
                </tr>
            </thead>
            <tbody>
                ${generateModelRows('gemini', modelsConfig.gemini.models)}
                ${generateModelRows('groq', modelsConfig.groq.models)}
                ${generateModelRows('cerebras', modelsConfig.cerebras.models)}
                ${generateModelRows('openrouter', modelsConfig.openrouter.models)}
            </tbody>
        </table>

        <p class="timestamp">Last updated: ${new Date().toLocaleString('es-ES')}</p>
    </div>
</body>
</html>`;
}

/**
 * Generate JSON API response
 */
function generateStatusJSON(): string {
    return JSON.stringify(aiRouter.getModelsStatus(), null, 2);
}

/**
 * Start the monitoring server
 */
export function startMonitoringServer(): void {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url || '/', `http://localhost:${MONITORING_PORT}`);

        if (url.pathname === '/api/status') {
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(generateStatusJSON());
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(generateDashboardHTML());
        }
    });

    server.listen(MONITORING_PORT, () => {
        console.log(`📊 AI Monitoring Dashboard: http://localhost:${MONITORING_PORT}`);
    });
}
