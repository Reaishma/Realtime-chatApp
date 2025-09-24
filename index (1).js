// React App Entry Point
const { useState, useEffect } = React;
const { createRoot } = ReactDOM;

// Main App Component
function App() {
    const [items, setItems] = useState([]);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch initial data
    useEffect(() => {
        fetchStatus();
        fetchItems();
    }, []);

    const fetchStatus = async () => {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            setStatus(data);
            
            // Update status display
            document.getElementById('api-status').textContent = data.status || 'Offline';
            document.getElementById('total-records').textContent = data.totalRecords || 0;
            document.getElementById('response-time').textContent = data.responseTime || '-';
            document.getElementById('last-updated').textContent = 
                data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : '-';
        } catch (error) {
            console.error('Failed to fetch status:', error);
            document.getElementById('api-status').textContent = 'Error';
        }
    };

    const fetchItems = async () => {
        try {
            const response = await fetch('/api/items');
            const data = await response.json();
            setItems(data.data || []);
            updateDataTable(data.data || []);
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateDataTable = (items) => {
        const tableContainer = document.getElementById('data-table');
        
        if (items.length === 0) {
            tableContainer.innerHTML = '<p>No data records found. Add some items using the form above.</p>';
            return;
        }

        const table = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Name</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Description</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Category</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Created</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 12px;">${item.name}</td>
                            <td style="padding: 12px;">${item.description}</td>
                            <td style="padding: 12px;">
                                <span style="background: ${getCategoryColor(item.category)}; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">
                                    ${item.category}
                                </span>
                            </td>
                            <td style="padding: 12px;">${new Date(item.createdAt).toLocaleDateString()}</td>
                            <td style="padding: 12px;">
                                <button onclick="deleteItem('${item.id}')" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        tableContainer.innerHTML = table;
    };

    const getCategoryColor = (category) => {
        switch(category) {
            case 'technical': return '#cfe2ff';
            case 'business': return '#e2e3ff';
            case 'general': 
            default: return '#d1e7dd';
        }
    };

    return React.createElement('div', { style: { display: 'none' } }, 'React App Loaded');
}

// Global functions for HTML interactions
window.fetchData = async () => {
    try {
        const response = await fetch('/api/items');
        const data = await response.json();
        document.getElementById('api-response').textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        document.getElementById('api-response').textContent = 'Error: ' + error.message;
    }
};

window.createSample = async () => {
    try {
        const sampleItem = {
            name: `Sample Item ${Date.now()}`,
            description: 'Created via API demo',
            category: 'general'
        };
        
        const response = await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sampleItem)
        });
        
        const data = await response.json();
        document.getElementById('api-response').textContent = JSON.stringify(data, null, 2);
        
        // Refresh data
        app.fetchItems();
        app.fetchStatus();
    } catch (error) {
        document.getElementById('api-response').textContent = 'Error: ' + error.message;
    }
};

window.clearResponse = () => {
    document.getElementById('api-response').textContent = 'Click a button to test the API...';
};

window.deleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
        const response = await fetch(`/api/items/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Item deleted successfully!');
            app.fetchItems();
            app.fetchStatus();
        } else {
            alert('Failed to delete item');
        }
    } catch (error) {
        alert('Error deleting item: ' + error.message);
    }
};

// Form submission handler
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('item-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const item = {
            name: formData.get('name'),
            description: formData.get('description'),
            category: formData.get('category')
        };
        
        try {
            const response = await fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            
            if (response.ok) {
                alert('Item created successfully!');
                form.reset();
                app.fetchItems();
                app.fetchStatus();
            } else {
                const error = await response.json();
                alert('Error: ' + (error.message || 'Failed to create item'));
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
});

// Global state and functions
let globalItems = [];
let globalStatus = null;

// Global functions for refreshing data
window.fetchStatus = async () => {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        globalStatus = data;
        
        // Update status display
        document.getElementById('api-status').textContent = data.status || 'Offline';
        document.getElementById('total-records').textContent = data.totalRecords || 0;
        document.getElementById('response-time').textContent = data.responseTime || '-';
        document.getElementById('last-updated').textContent = 
            data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : '-';
    } catch (error) {
        console.error('Failed to fetch status:', error);
        document.getElementById('api-status').textContent = 'Error';
    }
};

window.fetchItems = async () => {
    try {
        const response = await fetch('/api/items');
        const data = await response.json();
        globalItems = data.data || [];
        updateDataTable(globalItems);
    } catch (error) {
        console.error('Failed to fetch items:', error);
    }
};

const updateDataTable = (items) => {
    const tableContainer = document.getElementById('data-table');
    
    if (items.length === 0) {
        tableContainer.innerHTML = '<p>No data records found. Add some items using the form above.</p>';
        return;
    }

    const table = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Name</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Description</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Category</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Created</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr style="border-bottom: 1px solid #dee2e6;">
                        <td style="padding: 12px;">${item.name}</td>
                        <td style="padding: 12px;">${item.description}</td>
                        <td style="padding: 12px;">
                            <span style="background: ${getCategoryColor(item.category)}; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">
                                ${item.category}
                            </span>
                        </td>
                        <td style="padding: 12px;">${new Date(item.createdAt).toLocaleDateString()}</td>
                        <td style="padding: 12px;">
                            <button onclick="deleteItem('${item.id}')" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                                Delete
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = table;
};

const getCategoryColor = (category) => {
    switch(category) {
        case 'technical': return '#cfe2ff';
        case 'business': return '#e2e3ff';
        case 'general': 
        default: return '#d1e7dd';
    }
};

// Initialize React app
const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));

// Load initial data on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchStatus();
    fetchItems();
});