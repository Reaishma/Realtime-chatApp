// React App Component
const { useState, useEffect } = React;

function App() {
    const [items, setItems] = useState([]);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [apiResponse, setApiResponse] = useState('');

    useEffect(() => {
        fetchStatus();
        fetchItems();
    }, []);

    const fetchStatus = async () => {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            setStatus(data);
        } catch (error) {
            console.error('Failed to fetch status:', error);
        }
    };

    const fetchItems = async () => {
        try {
            const response = await fetch('/api/items');
            const data = await response.json();
            setItems(data.data || []);
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setLoading(false);
        }
    };

    const createItem = async (itemData) => {
        try {
            const response = await fetch('/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData)
            });
            
            if (response.ok) {
                fetchItems();
                fetchStatus();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to create item:', error);
            return false;
        }
    };

    const deleteItem = async (id) => {
        try {
            const response = await fetch(`/api/items/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                fetchItems();
                fetchStatus();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to delete item:', error);
            return false;
        }
    };

    const testAPI = async () => {
        try {
            const response = await fetch('/api/items');
            const data = await response.json();
            setApiResponse(JSON.stringify(data, null, 2));
        } catch (error) {
            setApiResponse('Error: ' + error.message);
        }
    };

    return React.createElement('div', {
        className: 'app-container',
        style: { maxWidth: '1200px', margin: '0 auto', padding: '20px' }
    }, [
        // Header
        React.createElement('header', {
            key: 'header',
            style: {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '2rem',
                borderRadius: '10px',
                marginBottom: '2rem',
                textAlign: 'center'
            }
        }, [
            React.createElement('h1', { key: 'title' }, 'React + Node.js Demo'),
            React.createElement('p', { key: 'subtitle' }, 'Full-stack application deployed on Vercel')
        ]),

        // Status Cards
        React.createElement('div', {
            key: 'status',
            style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }
        }, [
            React.createElement('div', {
                key: 'status-card',
                style: {
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }
            }, [
                React.createElement('div', {
                    key: 'status-value',
                    style: { fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }
                }, status?.status || 'Loading...'),
                React.createElement('div', {
                    key: 'status-label',
                    style: { color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }
                }, 'API Status')
            ])
        ]),

        // API Test Section
        React.createElement('div', {
            key: 'api-test',
            style: {
                background: 'white',
                padding: '2rem',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
            }
        }, [
            React.createElement('h2', { key: 'api-title' }, 'API Test'),
            React.createElement('button', {
                key: 'test-btn',
                onClick: testAPI,
                style: {
                    background: '#667eea',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }
            }, 'Test API'),
            React.createElement('pre', {
                key: 'response',
                style: {
                    background: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '5px',
                    marginTop: '1rem',
                    minHeight: '100px'
                }
            }, apiResponse || 'Click "Test API" to see response...')
        ]),

        // Items List
        React.createElement('div', {
            key: 'items',
            style: {
                background: 'white',
                padding: '2rem',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }
        }, [
            React.createElement('h2', { key: 'items-title' }, 'Items'),
            loading ? 
                React.createElement('p', { key: 'loading' }, 'Loading...') :
                items.length === 0 ?
                    React.createElement('p', { key: 'no-items' }, 'No items found.') :
                    React.createElement('div', { key: 'items-list' },
                        items.map(item => 
                            React.createElement('div', {
                                key: item.id,
                                style: {
                                    border: '1px solid #ddd',
                                    padding: '1rem',
                                    margin: '0.5rem 0',
                                    borderRadius: '5px'
                                }
                            }, [
                                React.createElement('h3', { key: 'name' }, item.name),
                                React.createElement('p', { key: 'desc' }, item.description),
                                React.createElement('span', { 
                                    key: 'cat',
                                    style: { 
                                        background: '#e3f2fd', 
                                        padding: '4px 8px', 
                                        borderRadius: '4px',
                                        fontSize: '0.8rem'
                                    }
                                }, item.category)
                            ])
                        )
                    )
        ])
    ]);
}

// Export for use in index.js
window.App = App;