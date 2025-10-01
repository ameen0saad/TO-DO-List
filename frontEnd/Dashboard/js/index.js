const APITasks = 'https://to-do-list-production-5d26.up.railway.app/api/v1/tasks';
const APIDeleteTasks = 'https://to-do-list-production-5d26.up.railway.app/api/v1/tasks';
const APILogout = 'https://to-do-list-production-5d26.up.railway.app/api/v1/users/logout';

const card = document.getElementById('card-continer');

// Global variables
let allTasks = [];
let currentFilter = 'all';

// Utility functions
const showMessage = (message, isError = false) => {
  const messageEl = document.createElement('div');
  messageEl.className = `delete-confirmation ${isError ? 'error' : 'update-success'}`;
  messageEl.textContent = message;
  document.body.appendChild(messageEl);

  setTimeout(() => {
    messageEl.remove();
  }, 2000);
};

const showConfirmationDialog = (message) => {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirmation-overlay active';

    const dialog = document.createElement('div');
    dialog.className = 'confirmation-dialog active';
    dialog.innerHTML = `
            <h3>Confirm Deletion</h3>
            <p>${message}</p>
            <div class="confirmation-buttons">
                <button class="cancel-btn">Cancel</button>
                <button class="confirm-btn">Delete</button>
            </div>
        `;

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);

    const confirmBtn = dialog.querySelector('.confirm-btn');
    const cancelBtn = dialog.querySelector('.cancel-btn');

    const cleanup = () => {
      overlay.remove();
      dialog.remove();
    };

    confirmBtn.onclick = () => {
      cleanup();
      resolve(true);
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(false);
      }
    };
  });
};

// Create task function
const createTask = async (taskData) => {
  try {
    const response = await fetch(APITasks, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to create task: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Task creation error:', error);
    throw error;
  }
};

// Update task function
const updateTask = async (id, taskData) => {
  try {
    const response = await fetch(`${APITasks}/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to update task: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Task update error:', error);
    throw error;
  }
};

const deleteDate = async (id) => {
  try {
    const response = await fetch(`${APIDeleteTasks}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to Delete data: ${response.status}`);
    }
  } catch (error) {
    console.error('Data delete error:', error);
    throw error;
  }
};

// Enhanced getData function with backend filtering
const getData = async (filter = 'all') => {
  try {
    // Build query parameters based on filter
    const queryParams = new URLSearchParams();

    // Add filter conditions based on your ApiFeatures syntax
    switch (filter) {
      case 'completed':
        queryParams.append('completed', 'true');
        break;
      case 'pending':
        queryParams.append('completed', 'false');
        break;
      case 'all':
      default:
        // No filter for all tasks
        break;
    }

    // Add sorting - completed first, then by priority and due date
    queryParams.append('sort', 'completed,-priority,dueDate');

    const url = `${APITasks}?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to load data: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Data fetch error:', error);
    throw error;
  }
};

// Update tasks counter
const updateTasksCounter = (filteredTasks, totalTasks) => {
  const counterElement = document.getElementById('tasksCounter');
  if (counterElement) {
    const completedCount = totalTasks.filter((task) => task.completed).length;
    const pendingCount = totalTasks.length - completedCount;

    switch (currentFilter) {
      case 'completed':
        counterElement.textContent = `Showing ${filteredTasks.length} completed task(s) • Total: ${totalTasks.length} tasks (${completedCount} completed, ${pendingCount} pending)`;
        break;
      case 'pending':
        counterElement.textContent = `Showing ${filteredTasks.length} pending task(s) • Total: ${totalTasks.length} tasks (${completedCount} completed, ${pendingCount} pending)`;
        break;
      default:
        counterElement.textContent = `Showing all ${filteredTasks.length} task(s) • ${completedCount} completed, ${pendingCount} pending`;
    }
  }
};

// Show create modal function
const showCreateModal = () => {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'update-modal create-modal active';

    // Set due date to tomorrow by default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0];

    modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Create New Task</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form class="update-form">
                    <div class="form-group">
                        <label for="create-title">Title:</label>
                        <input type="text" id="create-title" name="title" placeholder="Enter task title" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="create-description">Description:</label>
                        <textarea id="create-description" name="description" placeholder="Enter task description"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="create-priority">Priority:</label>
                        <select id="create-priority" name="priority">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="create-status">Status:</label>
                        <select id="create-status" name="status">
                            <option value="pending" selected>Pending</option>
                            <option value="inprogress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="create-dueDate">Due Date:</label>
                        <input type="date" id="create-dueDate" name="dueDate" value="${tomorrowFormatted}">
                    </div>
                    
                    <div class="form-buttons">
                        <button type="button" class="cancel-btn">Cancel</button>
                        <button type="submit" class="save-btn">Create Task</button>
                    </div>
                </form>
            </div>
        `;

    document.body.appendChild(modal);

    const closeModal = () => {
      modal.remove();
      resolve(null);
    };

    // Event listeners
    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    modal.querySelector('.cancel-btn').addEventListener('click', closeModal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Form submission
    modal.querySelector('.update-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const newTask = {
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority').toUpperCase(),
        status: formData.get('status').toUpperCase(),
        completed: false,
        dueDate: new Date(formData.get('dueDate')).toISOString() || null,
      };

      // Show loading state
      const saveBtn = modal.querySelector('.save-btn');
      const originalText = saveBtn.textContent;
      saveBtn.textContent = 'Creating...';
      saveBtn.disabled = true;

      try {
        const result = await createTask(newTask);
        modal.remove();
        resolve(result);
      } catch (error) {
        console.error('Create error:', error);
        showMessage('Failed to create task: ' + error.message, true);
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
      }
    });
  });
};

// Show update modal function
const showUpdateModal = (task) => {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'update-modal active';

    modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Update Task</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <form class="update-form">
                    <div class="form-group">
                        <label for="title">Title:</label>
                        <input type="text" id="title" name="title" value="${
                          task.title || ''
                        }" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="description">Description:</label>
                        <textarea id="description" name="description">${
                          task.description || ''
                        }</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="priority">Priority:</label>
                        <select id="priority" name="priority">
                            <option value="low" ${
                              task.priority === 'low' ? 'selected' : ''
                            }>Low</option>
                            <option value="medium" ${
                              task.priority === 'medium' ? 'selected' : ''
                            }>Medium</option>
                            <option value="high" ${
                              task.priority === 'high' ? 'selected' : ''
                            }>High</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="status">Status:</label>
                        <select id="status" name="status">
                            <option value="pending" ${
                              task.status === 'pending' ? 'selected' : ''
                            }>Pending</option>
                            <option value="inprogress" ${
                              task.status === 'inprogress' ? 'selected' : ''
                            }>In Progress</option>
                            <option value="completed" ${
                              task.status === 'completed' ? 'selected' : ''
                            }>Completed</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="dueDate">Due Date:</label>
                        <input type="date" id="dueDate" name="dueDate" value="${
                          task.dueDate ? task.dueDate.split('T')[0] : ''
                        }">
                    </div>
                    
                    <div class="form-buttons">
                        <button type="button" class="cancel-btn">Cancel</button>
                        <button type="submit" class="save-btn">Save Changes</button>
                    </div>
                </form>
            </div>
        `;

    document.body.appendChild(modal);

    const closeModal = () => {
      modal.remove();
      resolve(null);
    };

    // Event listeners
    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    modal.querySelector('.cancel-btn').addEventListener('click', closeModal);

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Form submission
    modal.querySelector('.update-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const updatedTask = {
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority').toUpperCase(),
        status: formData.get('status').toUpperCase(),
        dueDate: new Date(formData.get('dueDate')).toISOString() || null,
      };

      // Show loading state
      const saveBtn = modal.querySelector('.save-btn');
      const originalText = saveBtn.textContent;
      saveBtn.textContent = 'Saving...';
      saveBtn.disabled = true;

      try {
        const result = await updateTask(task.id, updatedTask);
        modal.remove();
        resolve(result);
      } catch (error) {
        console.error('Update error:', error);
        showMessage('Failed to update task: ' + error.message, true);
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
      }
    });
  });
};

// Create filter buttons
const createFilterButtons = () => {
  const filterContainer = document.createElement('div');
  filterContainer.className = 'filter-buttons';

  filterContainer.innerHTML = `
        <button class="filter-btn all-btn active" data-filter="all">All Tasks</button>
        <button class="filter-btn completed-btn" data-filter="completed">Completed</button>
        <button class="filter-btn" data-filter="pending">Pending</button>
    `;

  return filterContainer;
};

// Create tasks counter
const createTasksCounter = () => {
  const counter = document.createElement('div');
  counter.className = 'tasks-counter';
  counter.id = 'tasksCounter';
  counter.textContent = 'Loading tasks...';

  return counter;
};

// Create header with title, filters, and create button
const createHeader = () => {
  const header = document.createElement('div');
  header.className = 'tasks-header';

  header.innerHTML = `
        <div class="header-left">
            <h1 class="tasks-title">My Tasks</h1>
            <div id="filtersContainer"></div>
            <div id="counterContainer"></div>
        </div>
        <button class="header-create-btn" id="headerCreateBtn">
            <span>+ Create Task</span>
        </button>
    `;

  return header;
};

// Create floating action button
const createFAB = () => {
  const fab = document.createElement('button');
  fab.className = 'create-task-btn';
  fab.innerHTML = '+';
  fab.title = 'Create New Task';

  return fab;
};

// Apply filter function - Now using backend filtering
const applyFilter = async (filter) => {
  currentFilter = filter;

  // Update active button
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.classList.remove('active');
    if (btn.dataset.filter === filter) {
      btn.classList.add('active');
    }
  });

  // Show loading state
  card.innerHTML = '<div class="loading">Loading tasks...</div>';

  try {
    // Fetch data with backend filtering
    const data = await getData(filter);

    if (!data?.data?.tasks || !Array.isArray(data.data.tasks)) {
      allTasks = [];
      renderTasks([]);
    } else {
      allTasks = data.data.tasks;
      renderTasks(allTasks);
    }

    // Update counter
    updateTasksCounter(allTasks, allTasks);
  } catch (error) {
    console.error('Error applying filter:', error);
    showMessage('Failed to load tasks: ' + error.message, true);
    card.innerHTML = `<div class="error">Error loading tasks: ${error.message}</div>`;
  }
};

// Load all tasks for counter (without filtering)
const loadAllTasksForCounter = async () => {
  try {
    const data = await getData('all');
    return data?.data?.tasks || [];
  } catch (error) {
    console.error('Error loading all tasks for counter:', error);
    return [];
  }
};

// User API endpoint
const APIUser = 'https://to-do-list-production-5d26.up.railway.app/api/v1/users/me';

// Function to get user data
const getUserData = async () => {
  try {
    const response = await fetch(APIUser, {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      const userData = await response.json();
      return userData;
    }
    throw new Error('Failed to fetch user data');
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

// Function to update UI with user name
const updateUserName = (userData) => {
  const userNameElement = document.getElementById('userName');

  if (userData && userData.data && userData.data.user && userData.data.user.name) {
    userNameElement.textContent = userData.data.user.name;
    // Store for future use if needed
    localStorage.setItem('userName', userData.data.user.name);
  } else {
    // Try to get from storage as fallback
    const storedName = localStorage.getItem('userName');
    userNameElement.textContent = storedName || 'Guest';
  }
};

window.addEventListener('load', async (e) => {
  try {
    // Load user data first
    const userData = await getUserData();
    updateUserName(userData);

    if (!card) {
      console.error('Card container element not found');
      return;
    }

    // Create and insert header
    const header = createHeader();
    card.parentNode.insertBefore(header, card);

    // Add filters and counter
    const filtersContainer = document.getElementById('filtersContainer');
    const counterContainer = document.getElementById('counterContainer');

    filtersContainer.appendChild(createFilterButtons());
    counterContainer.appendChild(createTasksCounter());

    // Create and add floating action button
    const fab = createFAB();
    document.body.appendChild(fab);

    // Load all tasks for counter first
    const allTasksForCounter = await loadAllTasksForCounter();

    // Apply initial filter
    await applyFilter('all');

    // Update counter with total task count
    updateTasksCounter(allTasks, allTasksForCounter);

    // Add event listeners for create buttons
    document.getElementById('headerCreateBtn').addEventListener('click', handleCreateTask);
    fab.addEventListener('click', handleCreateTask);

    // Add event listeners for filter buttons
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        applyFilter(e.target.dataset.filter);
      });
    });
  } catch (error) {
    console.error('Error loading page:', error);
    if (card) {
      card.innerHTML = `<div class="error">Error loading tasks: ${error.message}</div>`;
    }
  }
});

// Function to render tasks
const renderTasks = (tasks) => {
  if (tasks.length === 0) {
    let message = '';
    switch (currentFilter) {
      case 'completed':
        message =
          '<div class="no-tasks-message"><h3>No completed tasks</h3><p>Complete some tasks to see them here!</p></div>';
        break;
      case 'pending':
        message =
          '<div class="no-tasks-message"><h3>No pending tasks</h3><p>All tasks are completed! 🎉</p></div>';
        break;
      default:
        message =
          '<div class="no-tasks-message"><h3>No tasks found</h3><p>Create your first task to get started!</p></div>';
    }
    card.innerHTML = message;
    return;
  }

  card.innerHTML = '';

  tasks.forEach((ele) => {
    const task = document.createElement('div');
    task.className = 'task-item';
    task.id = ele.id;

    // Add data attributes for CSS styling
    task.setAttribute('data-priority', ele.priority?.toLowerCase() || 'medium');
    task.setAttribute('data-status', ele.status?.toLowerCase() || 'pending');
    task.setAttribute('data-completed', ele.completed?.toString() || 'false');

    // Create header container
    const header = document.createElement('div');
    header.className = 'task-header';

    const title = document.createElement('strong');
    title.className = 'task-title';
    title.textContent = ele.title || 'Untitled Task';

    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'task-buttons';

    const updateButton = document.createElement('button');
    updateButton.className = 'update-btn';
    updateButton.textContent = 'Update';
    updateButton.title = 'Edit this task';

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = 'Delete';
    deleteButton.title = 'Delete this task';

    // Create details container
    const details = document.createElement('div');
    details.className = 'task-details';

    // Completed checkbox
    const completedCheckbox = document.createElement('div');
    completedCheckbox.className = `completed-checkbox ${ele.completed ? 'completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `completed-${ele.id}`;
    checkbox.checked = ele.completed;

    const checkboxLabel = document.createElement('label');
    checkboxLabel.htmlFor = `completed-${ele.id}`;
    checkboxLabel.textContent = 'Completed';

    completedCheckbox.appendChild(checkbox);
    completedCheckbox.appendChild(checkboxLabel);

    const description = document.createElement('p');
    description.setAttribute('data-label', 'Description:');
    description.textContent = ele.description || 'No description provided';

    const priority = document.createElement('p');
    priority.setAttribute('data-label', 'Priority:');
    priority.textContent = ele.priority || 'Not set';

    const status = document.createElement('p');
    status.setAttribute('data-label', 'Status:');
    status.textContent = ele.status || 'Pending';

    const dueDate = document.createElement('p');
    dueDate.setAttribute('data-label', 'Due Date:');
    dueDate.textContent = ele.dueDate ? new Date(ele.dueDate).toLocaleDateString() : 'Not set';

    const createdAt = document.createElement('p');
    createdAt.setAttribute('data-label', 'Created:');
    createdAt.textContent = new Date(ele.createdAt).toLocaleDateString();

    // Completed checkbox functionality
    checkbox.addEventListener('change', async (e) => {
      const originalChecked = checkbox.checked;

      // Show loading state
      checkbox.disabled = true;
      completedCheckbox.style.opacity = '0.7';

      try {
        await updateTask(ele.id, { completed: checkbox.checked });

        // Update UI
        if (checkbox.checked) {
          completedCheckbox.classList.add('completed');
          task.setAttribute('data-completed', 'true');
        } else {
          completedCheckbox.classList.remove('completed');
          task.setAttribute('data-completed', 'false');
        }

        showMessage(`Task marked as ${checkbox.checked ? 'completed' : 'incomplete'}!`);

        // Re-fetch data to reflect changes in current filter
        await applyFilter(currentFilter);
      } catch (error) {
        console.error('Completion update error:', error);
        // Revert checkbox state
        checkbox.checked = !originalChecked;
        showMessage('Failed to update task completion: ' + error.message, true);
      } finally {
        checkbox.disabled = false;
        completedCheckbox.style.opacity = '1';
      }
    });

    // Update functionality
    updateButton.addEventListener('click', async (e) => {
      const result = await showUpdateModal(ele);
      if (result) {
        showMessage('Task updated successfully!');
        // Re-fetch data to show updated data
        await applyFilter(currentFilter);
      }
    });

    // Delete functionality
    deleteButton.addEventListener('click', async (e) => {
      const isConfirmed = await showConfirmationDialog(
        'Are you sure you want to delete this task? This action cannot be undone.'
      );

      if (!isConfirmed) {
        return;
      }

      const originalText = deleteButton.textContent;
      deleteButton.textContent = 'Deleting...';
      deleteButton.disabled = true;

      try {
        await deleteDate(task.id);

        // Show success message
        showMessage('Task deleted successfully!');

        // Add deletion animation
        task.classList.add('deleting');

        // Remove from DOM after animation
        setTimeout(() => {
          task.remove();

          // Re-fetch data to update the view
          applyFilter(currentFilter);
        }, 300);
      } catch (error) {
        console.error('Delete error:', error);
        // Show error message
        showMessage('Failed to delete task: ' + error.message, true);
        deleteButton.textContent = originalText;
        deleteButton.disabled = false;
      }
    });

    // Append elements
    buttonsContainer.append(updateButton, deleteButton);
    header.append(title, buttonsContainer);
    details.append(completedCheckbox, description, priority, status, dueDate, createdAt);
    task.append(header, details);
    card.append(task);
  });
};

// Handle create task
const handleCreateTask = async () => {
  const result = await showCreateModal();
  if (result) {
    showMessage('Task created successfully!');
    // Re-fetch data to show the new task
    await applyFilter(currentFilter);
  }
};
const logout = async () => {
  try {
    const response = await fetch(APILogout, {
      method: 'GET',
      credentials: 'include', // Fixed: changed true to 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to Logout: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Logout error:', error); // Fixed: changed 'Task creation error' to 'Logout error'
    throw error;
  }
};

const logoutButton = document.getElementById('logoutBtn');
logoutButton.addEventListener('click', async () => {
  try {
    // Optional: Add loading state
    logoutButton.disabled = true;
    logoutButton.textContent = 'Logging out...';

    await logout();

    // Redirect to login page after successful logout
    window.location.href = '/frontEnd/Login_v1/index.html';
  } catch (error) {
    // Re-enable button on error
    logoutButton.disabled = false;
    logoutButton.textContent = 'Logout';

    // Show error message to user
    alert('Logout failed: ' + error.message);
    // Or use a better UI notification system
    console.error('Logout failed:', error);
  }
});
