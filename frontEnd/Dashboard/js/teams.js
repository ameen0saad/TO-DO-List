// API endpoints
const APITeams = 'https://to-do-list-production-5d26.up.railway.app/api/v1/teams';
const APITeamTasks = 'https://to-do-list-production-5d26.up.railway.app/api/v1/teamTasks';
const APIUser = 'https://to-do-list-production-5d26.up.railway.app/api/v1/users/me';
const APILogout = 'https://to-do-list-production-5d26.up.railway.app/api/v1/users/logout';

// Global variables
let currentUser = null;
let currentTeams = [];
let selectedTeam = null;
let teamMembers = [];
let teamToDelete = null;
let currentView = 'teams-list'; // Track current view: 'teams-list' or 'team-details'

// DOM elements
const teamsContainer = document.getElementById('teamsContainer');
const createTeamForm = document.getElementById('createTeamForm');
const teamMembersInput = document.getElementById('teamMembers');
const membersTagsContainer = document.getElementById('membersTags');
const tabContents = document.querySelectorAll('.tab-content');
const tabButtons = document.querySelectorAll('.tab-btn');
const teamDetailsView = document.getElementById('team-details-view');
const teamTaskModal = document.getElementById('teamTaskModal');
const teamTaskForm = document.getElementById('teamTaskForm');
const deleteTeamModal = document.getElementById('deleteTeamModal');
const cancelDeleteTeamBtn = document.getElementById('cancelDeleteTeam');
const confirmDeleteTeamBtn = document.getElementById('confirmDeleteTeam');
const transferOwnerModal = document.getElementById('transferOwnerModal');

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', async () => {
  await loadUserData();
  await loadTeams();
  setupEventListeners();
});

// Load user data
async function loadUserData() {
  try {
    const response = await fetch(APIUser, {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      const userData = await response.json();
      currentUser = userData.data.user;
      document.getElementById('userName').textContent = currentUser.name;
    } else {
      throw new Error('Failed to fetch user data');
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    document.getElementById('userName').textContent = 'Guest';
  }
}

// Load teams data
async function loadTeams() {
  try {
    const response = await fetch(APITeams, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to load teams: ${response.status}`);
    }

    const data = await response.json();
    currentTeams = data.data.teams || [];
    renderTeams();
  } catch (error) {
    console.error('Error loading teams:', error);
    teamsContainer.innerHTML = `<div class="error">Error loading teams: ${error.message}</div>`;
  }
}

// Render teams in the grid
function renderTeams() {
  if (currentTeams.length === 0) {
    teamsContainer.innerHTML = `
            <div class="no-teams-message">
                <h3>No Teams Yet</h3>
                <p>Create your first team to start collaborating!</p>
            </div>
        `;
    return;
  }

  teamsContainer.innerHTML = '';
  currentTeams.forEach((team) => {
    const isOwner = team.ownerId === currentUser.id;
    const teamCard = document.createElement('div');
    teamCard.className = 'team-card';
    teamCard.dataset.teamId = team.id;
    teamCard.innerHTML = `
            <div class="team-card-header">
                <h3 class="team-name">${team.name}</h3>
                <span class="team-role ${isOwner ? 'owner' : ''}">${
      isOwner ? 'Owner' : 'Member'
    }</span>
            </div>
            <p class="team-description">${team.description || 'No description provided'}</p>
            <div class="team-members">
                <div class="members-title">
                    <span>Members (${team.user.length})</span>
                </div>
                <div class="members-list">
                    ${team.user
                      .map(
                        (member) => `
                        <div class="member-item">
                            <div class="member-avatar">${member.name.charAt(0).toUpperCase()}</div>
                            <span class="member-name">${member.name}</span>
                            <span class="member-role">${
                              member.id === team.ownerId ? 'Owner' : 'Member'
                            }</span>
                        </div>
                    `
                      )
                      .join('')}
                </div>
            </div>
            <div class="team-actions">
                <button class="team-action-btn view-team-btn" data-team-id="${team.id}">
                    ${isOwner ? 'Manage Team' : 'View Team'}
                </button>
                ${
                  !isOwner
                    ? `<button class="team-action-btn leave-team-btn" data-team-id="${team.id}">Leave</button>`
                    : ''
                }
            </div>
        `;

    teamsContainer.appendChild(teamCard);
  });

  // Add event listeners to team action buttons
  document.querySelectorAll('.view-team-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const teamId = e.target.dataset.teamId;
      window.location.href = `team-tasks.html?teamId=${teamId}`;
      //viewTeamDetails(teamId);
    });
  });

  document.querySelectorAll('.leave-team-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const teamId = e.target.dataset.teamId;
      leaveTeam(teamId);
    });
  });
}

// View team details
async function viewTeamDetails(teamId) {
  try {
    const response = await fetch(`${APITeams}/${teamId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to load team details: ${response.status}`);
    }

    const data = await response.json();
    selectedTeam = data.data.team;
    currentView = 'team-details';

    displayTeamDetails();
    switchToTab('team-details-view');
  } catch (error) {
    console.error('Error loading team details:', error);
    showMessage('Failed to load team details: ' + error.message, true);
  }
}

// Display team details with sidebar layout
function displayTeamDetails() {
  if (!selectedTeam) return;
  const isOwner = selectedTeam.ownerId === currentUser.id;

  teamDetailsView.innerHTML = `
        <div class="team-details">
            <div class="team-details-header">
                <button class="back-to-teams" id="backToTeams">← Back to Teams</button>
            </div>
            
            <div class="team-header">
                <div class="team-header-content">
                    <div class="team-info">
                        <h2>${selectedTeam.name}</h2>
                        <p class="team-description">${
                          selectedTeam.description || 'No description provided'
                        }</p>
                    </div>
                    <span class="team-role-badge">${isOwner ? 'Team Owner' : 'Team Member'}</span>
                </div>
            </div>
            
            <div class="team-details-layout">
                <!-- Sidebar for Team Members -->
                <div class="team-sidebar">
                    <div class="members-management">
                        <h3>Team Members</h3>
                        
                        ${
                          isOwner
                            ? `
                            <div class="add-member-section">
                                <div class="add-member-input-group">
                                    <input type="email" class="add-member-input" id="addMemberInput" placeholder="Enter email address">
                                    <button class="add-member-btn" id="addMemberBtn">Add</button>
                                </div>
                            </div>
                        `
                            : ''
                        }
                        
                        <div class="members-list-sidebar">
                            ${selectedTeam.user
                              .map(
                                (member) => `
                                <div class="member-item-sidebar">
                                    <div class="member-avatar-sidebar">${member.name
                                      .charAt(0)
                                      .toUpperCase()}</div>
                                    <div class="member-info-sidebar">
                                        <div class="member-name-sidebar">${member.name}</div>
                                        <div class="member-email-sidebar">${member.email}</div>
                                        <span class="member-role-sidebar ${
                                          member.id === selectedTeam.ownerId ? 'owner' : 'member'
                                        }">
                                            ${
                                              member.id === selectedTeam.ownerId
                                                ? 'Owner'
                                                : 'Member'
                                            }
                                        </span>
                                    </div>
                                    ${
                                      isOwner && member.id !== selectedTeam.ownerId
                                        ? `<div class="member-actions-sidebar">
                                            <button class="remove-member-btn-sidebar" data-email="${member.email}">Remove</button>
                                        </div>`
                                        : ''
                                    }
                                </div>
                            `
                              )
                              .join('')}
                        </div>
                    </div>
                    
                    ${
                      isOwner
                        ? `
                        <div class="team-management-actions">
                            <h4>Team Management</h4>
                            <button class="transfer-ownership-btn" id="transferOwnershipBtn">
                                Transfer Ownership
                            </button>
                        </div>
                        
                        <div class="danger-zone-sidebar">
                            <h4>Danger Zone</h4>
                            <p>Permanently delete this team and all its tasks. This action cannot be undone.</p>
                            <button class="delete-team-btn-sidebar" id="deleteTeamBtn">Delete Team</button>
                        </div>
                    `
                        : ''
                    }
                </div>
                
                <!-- Main Content for Team Tasks -->
                <div class="team-main-content">
                    <div class="tasks-header">
                        <h3>Team Tasks</h3>
                        ${
                          isOwner
                            ? '<button class="add-task-btn-main" id="addTeamTask">+ Create Task</button>'
                            : ''
                        }
                    </div>
                    
                    <div id="teamTasksContainer">
                        <div class="loading">Loading tasks...</div>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Add event listeners
  document.getElementById('backToTeams').addEventListener('click', () => {
    currentView = 'teams-list';
    switchToTab('my-teams');
  });

  if (isOwner) {
    document.getElementById('addTeamTask').addEventListener('click', () => {
      showTeamTaskModal();
    });

    document.getElementById('addMemberBtn').addEventListener('click', () => {
      const emailInput = document.getElementById('addMemberInput');
      const email = emailInput.value.trim().toLowerCase();
      console.log(email);
      if (email && isValidEmail(email)) {
        addMemberToTeam(email);
        emailInput.value = '';
      } else {
        showMessage('Please enter a valid email address', true);
      }
    });

    document.getElementById('deleteTeamBtn').addEventListener('click', () => {
      showDeleteTeamModal();
    });

    document.getElementById('transferOwnershipBtn').addEventListener('click', () => {
      showTransferOwnerModal();
    });

    // Add event listeners to remove member buttons
    document.querySelectorAll('.remove-member-btn-sidebar').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const email = e.target.dataset.email;
        removeMemberFromTeam(email);
      });
    });

    // Allow pressing Enter to add member
    document.getElementById('addMemberInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('addMemberBtn').click();
      }
    });
  }

  loadTeamTasks(selectedTeam.id);
}

// Load team tasks
async function loadTeamTasks(teamId) {
  try {
    const response = await fetch(`${APITeamTasks}/${teamId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to load team tasks: ${response.status}`);
    }

    const data = await response.json();
    renderTeamTasks(data.data.teamTasks || []);
  } catch (error) {
    console.error('Error loading team tasks:', error);
    document.getElementById(
      'teamTasksContainer'
    ).innerHTML = `<div class="error">Error loading tasks: ${error.message}</div>`;
  }
}

// Render team tasks as cards with permission-based buttons
function renderTeamTasks(tasks) {
  const container = document.getElementById('teamTasksContainer');
  const isOwner = selectedTeam.ownerId === currentUser.id;

  if (tasks.length === 0) {
    container.innerHTML = `
            <div class="no-tasks-state">
                <h4>No Tasks Yet</h4>
                <p>Get started by creating the first task for your team</p>
                ${
                  isOwner
                    ? '<button class="add-task-btn-main" id="createFirstTask">Create First Task</button>'
                    : '<p class="no-tasks-message">Only team owners can create tasks</p>'
                }
            </div>
        `;

    if (isOwner) {
      document.getElementById('createFirstTask').addEventListener('click', () => {
        showTeamTaskModal();
      });
    }
    return;
  }

  // Calculate task statistics
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = tasks.length - completedTasks;

  container.innerHTML = `
        <div class="tasks-stats">
            <div class="tasks-stat total">Total: ${tasks.length}</div>
            <div class="tasks-stat completed">Completed: ${completedTasks}</div>
            <div class="tasks-stat pending">Pending: ${pendingTasks}</div>
            ${
              !isOwner
                ? '<div class="tasks-stat permission">You can only update task status</div>'
                : ''
            }
        </div>
        
        <div class="tasks-filter">
            <button class="filter-btn active" data-filter="all">All Tasks</button>
            <button class="filter-btn" data-filter="pending">Pending</button>
            <button class="filter-btn" data-filter="completed">Completed</button>
        </div>
        
        <div class="tasks-grid" id="tasksGrid">
            ${tasks
              .map(
                (task) => `
                <div class="team-task-card ${task.completed ? 'completed' : ''}" 
                     data-task-id="${task.id}" 
                     data-priority="${task.priority || 'MEDIUM'}"
                     data-completed="${task.completed}">
                    <div class="team-task-card-header">
                        <h3 class="team-task-title">${task.title}</h3>
                        <div class="team-task-actions">
                            ${
                              isOwner
                                ? `<button class="team-task-update-btn" data-task-id="${task.id}" title="Edit Task">Edit</button>
                                 <button class="team-task-delete-btn" data-task-id="${task.id}" title="Delete Task">Delete</button>`
                                : `<button class="team-task-update-btn" data-task-id="${task.id}" title="Update Status">Update Status</button>`
                            }
                        </div>
                    </div>
                    
                    <div class="team-task-details">
                        ${
                          task.description
                            ? `
                            <p class="team-task-description">${task.description}</p>
                        `
                            : ''
                        }
                        
                        <div class="team-task-meta">
                            <div class="team-task-meta-item">
                                <span class="team-task-meta-label">Priority</span>
                                <span class="team-task-meta-value priority-${(
                                  task.priority || 'medium'
                                ).toLowerCase()}">
                                    ${task.priority || 'Not set'}
                                </span>
                            </div>
                            
                            <div class="team-task-meta-item">
                                <span class="team-task-meta-label">Status</span>
                                <span class="team-task-meta-value status-${(
                                  task.status || 'pending'
                                ).toLowerCase()}">
                                    ${task.status || 'Pending'}
                                </span>
                            </div>
                            
                            <div class="team-task-meta-item">
                                <span class="team-task-meta-label">Due Date</span>
                                <span class="team-task-meta-value">
                                    ${
                                      task.dueDate
                                        ? new Date(task.dueDate).toLocaleDateString()
                                        : 'Not set'
                                    }
                                </span>
                            </div>
                            
                            ${
                              isOwner
                                ? `
                                <div class="team-task-meta-item">
                                    <span class="team-task-meta-label">Created</span>
                                    <span class="team-task-meta-value">
                                        ${new Date(task.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            `
                                : ''
                            }
                        </div>
                        
                        <div class="team-task-completed">
                            <input type="checkbox" id="completed-${task.id}" ${
                  task.completed ? 'checked' : ''
                }>
                            <label for="completed-${task.id}">${
                  task.completed ? 'Completed' : 'Mark as completed'
                }</label>
                        </div>
                    </div>
                </div>
            `
              )
              .join('')}
        </div>
    `;

  // Add event listeners to task buttons
  document.querySelectorAll('.team-task-update-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const taskId = e.target.dataset.taskId;
      const task = tasks.find((t) => t.id === taskId);
      showTeamTaskModal(task);
    });
  });

  document.querySelectorAll('.team-task-delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const taskId = e.target.dataset.taskId;
      deleteTeamTask(taskId);
    });
  });

  document.querySelectorAll('.team-task-completed input').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const taskId = e.target.id.replace('completed-', '');
      const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);

      // Show loading state
      const originalLabel = e.target.nextElementSibling;
      originalLabel.textContent = 'Updating...';
      e.target.disabled = true;

      updateTeamTaskStatus(taskId, e.target.checked)
        .then(() => {
          // Update the card appearance
          if (e.target.checked) {
            taskCard.classList.add('completed');
            originalLabel.textContent = 'Completed';
          } else {
            taskCard.classList.remove('completed');
            originalLabel.textContent = 'Mark as completed';
          }
          e.target.disabled = false;

          // Update task statistics
          updateTaskStatistics();
        })
        .catch((error) => {
          console.error('Error updating task status:', error);
          e.target.checked = !e.target.checked; // Revert checkbox
          e.target.disabled = false;
          originalLabel.textContent = e.target.checked ? 'Completed' : 'Mark as completed';
          showMessage('Failed to update task status: ' + error.message, true);
        });
    });
  });

  // Add filter functionality
  setupTaskFilters(tasks);
}

// Setup task filtering
function setupTaskFilters(allTasks) {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const tasksGrid = document.getElementById('tasksGrid');

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.dataset.filter;

      // Update active button
      filterButtons.forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');

      // Filter tasks
      let filteredTasks = allTasks;
      if (filter === 'completed') {
        filteredTasks = allTasks.filter((task) => task.completed);
      } else if (filter === 'pending') {
        filteredTasks = allTasks.filter((task) => !task.completed);
      }

      // Show/hide tasks
      const allTaskCards = tasksGrid.querySelectorAll('.team-task-card');
      allTaskCards.forEach((card) => {
        const taskId = card.dataset.taskId;
        const task = allTasks.find((t) => t.id === taskId);
        if (
          filter === 'all' ||
          (filter === 'completed' && task.completed) ||
          (filter === 'pending' && !task.completed)
        ) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });

      // Update statistics for current filter
      updateTaskStatistics(filter, filteredTasks.length);
    });
  });
}

// Update task statistics
function updateTaskStatistics(filter = 'all', filteredCount = null) {
  const statsContainer = document.querySelector('.tasks-stats');
  if (!statsContainer) return;

  const allTasks = document.querySelectorAll('.team-task-card');
  const completedTasks = document.querySelectorAll('.team-task-card.completed');
  const pendingTasks = allTasks.length - completedTasks.length;

  if (filteredCount !== null) {
    statsContainer.innerHTML = `
            <div class="tasks-stat total">Showing: ${filteredCount}</div>
            <div class="tasks-stat completed">Completed: ${completedTasks.length}</div>
            <div class="tasks-stat pending">Pending: ${pendingTasks}</div>
        `;
  } else {
    statsContainer.innerHTML = `
            <div class="tasks-stat total">Total: ${allTasks.length}</div>
            <div class="tasks-stat completed">Completed: ${completedTasks.length}</div>
            <div class="tasks-stat pending">Pending: ${pendingTasks}</div>
        `;
  }
}

// Show team task modal with enhanced form
function showTeamTaskModal(task = null) {
  const isEdit = task !== null;
  const isOwner = selectedTeam.ownerId === currentUser.id;
  const modal = teamTaskModal;
  const form = teamTaskForm;

  // Set modal title
  document.getElementById('teamTaskModalTitle').textContent = isEdit
    ? 'Update Team Task'
    : 'Create Team Task';

  // Clear form first
  form.reset();

  // Set form values if editing
  if (isEdit) {
    document.getElementById('teamTaskTitle').value = task.title || '';
    document.getElementById('teamTaskDescription').value = task.description || '';
    document.getElementById('teamTaskPriority').value = (task.priority || 'medium').toLowerCase();
    document.getElementById('teamTaskStatus').value = (task.status || 'pending').toLowerCase();
    document.getElementById('teamTaskDueDate').value = task.dueDate
      ? task.dueDate.split('T')[0]
      : '';
  } else {
    // Set default due date to tomorrow for new tasks
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('teamTaskDueDate').value = tomorrow.toISOString().split('T')[0];

    // Set default values for new tasks
    document.getElementById('teamTaskPriority').value = 'medium';
    document.getElementById('teamTaskStatus').value = 'pending';
  }

  // Show/hide fields based on permissions
  const titleField = document.getElementById('teamTaskTitle').closest('.form-group');
  const descriptionField = document.getElementById('teamTaskDescription').closest('.form-group');
  const priorityField = document.getElementById('teamTaskPriority').closest('.form-group');
  const dueDateField = document.getElementById('teamTaskDueDate').closest('.form-group');
  const statusField = document.getElementById('teamTaskStatus').closest('.form-group');

  if (isEdit && !isOwner) {
    // Member editing - only show status field
    titleField.style.display = 'none';
    descriptionField.style.display = 'none';
    priorityField.style.display = 'none';
    dueDateField.style.display = 'none';
    statusField.style.display = 'block';

    // Update modal title for members
    document.getElementById('teamTaskModalTitle').textContent = 'Update Task Status';
  } else {
    // Owner or creating new task - show all fields
    titleField.style.display = 'block';
    descriptionField.style.display = 'block';
    priorityField.style.display = 'block';
    dueDateField.style.display = 'block';
    statusField.style.display = 'block';
  }

  // Update submit button text
  const submitBtn = form.querySelector('.save-btn');
  submitBtn.textContent = isEdit ? 'Update Task' : 'Create Task';

  // Show modal
  modal.classList.add('active');

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    let taskData = {};

    if (isEdit && !isOwner) {
      // Member can only update status
      taskData = {
        status: formData.get('status').toUpperCase(),
      };
    } else if (isOwner) {
      // Owner can update everything
      taskData = {
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority').toUpperCase(),
        status: formData.get('status').toUpperCase(),
        dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate')).toISOString() : null,
      };
    } else {
      // Creating new task (only owner can create)
      taskData = {
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority').toUpperCase(),
        status: formData.get('status').toUpperCase(),
        dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate')).toISOString() : null,
      };
    }

    // Validate required fields for owners creating/editing tasks
    if (isOwner || !isEdit) {
      if (!taskData.title || taskData.title.trim() === '') {
        showMessage('Task title is required', true);
        return;
      }
    }

    try {
      // Show loading state
      submitBtn.textContent = 'Saving...';
      submitBtn.disabled = true;

      if (isEdit) {
        await updateTeamTask(task.id, taskData);
        showMessage('Task updated successfully!');
      } else {
        await createTeamTask(taskData);
        showMessage('Task created successfully!');
      }

      modal.classList.remove('active');
      form.removeEventListener('submit', handleSubmit);
      loadTeamTasks(selectedTeam.id);
    } catch (error) {
      console.error('Error saving task:', error);
      showMessage('Failed to save task: ' + error.message, true);
      submitBtn.textContent = isEdit ? 'Update Task' : 'Create Task';
      submitBtn.disabled = false;
    }
  };

  form.addEventListener('submit', handleSubmit);
}

// Create team task - only owners can create
async function createTeamTask(taskData) {
  // Only owners can create tasks
  if (selectedTeam.ownerId !== currentUser.id) {
    throw new Error('Only team owners can create tasks');
  }

  const response = await fetch(`${APITeamTasks}/${selectedTeam.id}`, {
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
}

// Update team task with permission handling
async function updateTeamTask(taskId, taskData) {
  const isOwner = selectedTeam.ownerId === currentUser.id;

  // For members, we only allow status updates
  if (!isOwner) {
    // Check if member is trying to update more than just status
    const allowedFields = ['status', 'completed'];
    const attemptedFields = Object.keys(taskData);
    const unauthorizedFields = attemptedFields.filter(
      (field) => !allowedFields.includes(field.toLowerCase())
    );

    if (unauthorizedFields.length > 0) {
      throw new Error('You are only allowed to update task status');
    }
  }

  const response = await fetch(`${APITeamTasks}/${selectedTeam.id}/${taskId}`, {
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
}

// Update team task status with permission check
async function updateTeamTaskStatus(taskId, completed) {
  const isOwner = selectedTeam.ownerId === currentUser.id;

  try {
    // For members, we only update status and completed fields
    const updateData = {
      completed: completed,
      status: completed ? 'DONE' : 'PENDING',
    };

    const response = await fetch(`${APITeamTasks}/${selectedTeam.id}/${taskId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();

      // Check if it's a permission error
      if (response.status === 403) {
        throw new Error('You are only allowed to update task status');
      }

      throw new Error(errorData.message || `Failed to update task status: ${response.status}`);
    }

    showMessage(`Task marked as ${completed ? 'completed' : 'incomplete'}!`);
    return await response.json();
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}

// Delete team task
async function deleteTeamTask(taskId) {
  const confirmed = await showConfirmationDialog('Are you sure you want to delete this task?');
  if (!confirmed) return;

  const response = await fetch(`${APITeamTasks}/${selectedTeam.id}/${taskId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to delete task: ${response.status}`);
  }

  showMessage('Task deleted successfully!');
  loadTeamTasks(selectedTeam.id);
}

// Leave team (for non-owners)
async function leaveTeam(teamId) {
  const confirmed = await showConfirmationDialog('Are you sure you want to leave this team?');
  if (!confirmed) return;

  try {
    const response = await fetch(`${APITeams}/leaveTeam/${teamId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to leave team: ${response.status}`);
    }

    showMessage('You have left the team successfully!');
    await loadTeams();
    switchToTab('my-teams');
  } catch (error) {
    console.error('Error leaving team:', error);
    showMessage('Failed to leave team: ' + error.message, true);
  }
}

// Delete team (for owners only)
async function deleteTeam(teamId) {
  try {
    const response = await fetch(`${APITeams}/${teamId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to delete team: ${response.status}`);
    }

    showMessage('Team deleted successfully!');
    await loadTeams();
    switchToTab('my-teams');
    deleteTeamModal.classList.remove('active');
  } catch (error) {
    console.error('Error deleting team:', error);
    showMessage('Failed to delete team: ' + error.message, true);
  }
}

// Show delete team confirmation modal
function showDeleteTeamModal() {
  teamToDelete = selectedTeam.id;
  deleteTeamModal.classList.add('active');
}

// Show transfer owner modal
function showTransferOwnerModal() {
  // Create modal if it doesn't exist
  if (!document.getElementById('transferOwnerModal')) {
    const modal = document.createElement('div');
    modal.id = 'transferOwnerModal';
    modal.className = 'update-modal';
    modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">Transfer Ownership</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Select a team member to transfer ownership to:</p>
                    <div class="transfer-members-list" id="transferMembersList"></div>
                </div>
                <div class="form-buttons">
                    <button class="cancel-btn" id="cancelTransferOwner">Cancel</button>
                </div>
            </div>
        `;
    document.body.appendChild(modal);
  }

  const modal = document.getElementById('transferOwnerModal');
  const membersList = document.getElementById('transferMembersList');

  // Filter out current owner and populate members list
  const transferableMembers = selectedTeam.user.filter(
    (member) => member.id !== selectedTeam.ownerId
  );

  if (transferableMembers.length === 0) {
    membersList.innerHTML =
      '<p class="no-members-message">No other team members available for transfer.</p>';
  } else {
    membersList.innerHTML = transferableMembers
      .map(
        (member) => `
            <div class="transfer-member-item">
                <div class="transfer-member-info">
                    <div class="member-avatar-sidebar">${member.name.charAt(0).toUpperCase()}</div>
                    <div class="member-details">
                        <div class="member-name-sidebar">${member.name}</div>
                        <div class="member-email-sidebar">${member.email}</div>
                    </div>
                </div>
                <button class="transfer-owner-confirm-btn" data-member-id="${
                  member.id
                }" data-member-name="${member.name}">
                    Transfer
                </button>
            </div>
        `
      )
      .join('');

    // Add event listeners to transfer buttons
    document.querySelectorAll('.transfer-owner-confirm-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const memberId = e.target.dataset.memberId;
        const memberName = e.target.dataset.memberName;
        transferOwnership(memberId, memberName);
      });
    });
  }

  modal.classList.add('active');
}

// Transfer ownership
async function transferOwnership(memberId, memberName) {
  const confirmed = await showConfirmationDialog(
    `Are you sure you want to transfer ownership to ${memberName}? You will become a regular member of the team.`
  );

  if (!confirmed) return;

  try {
    const response = await fetch(`${APITeams}/transfareOwner/${selectedTeam.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newOwnerId: memberId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to transfer ownership: ${response.status}`);
    }

    showMessage(`Ownership transferred successfully to ${memberName}!`);

    // Close modal
    document.getElementById('transferOwnerModal').classList.remove('active');

    // Reload team details to reflect changes
    viewTeamDetails(selectedTeam.id);
  } catch (error) {
    console.error('Error transferring ownership:', error);
    showMessage('Failed to transfer ownership: ' + error.message, true);
  }
}

// Remove member from team (owner only)
async function removeMemberFromTeam(email) {
  const confirmed = await showConfirmationDialog(
    `Are you sure you want to remove ${email} from the team?`
  );
  if (!confirmed) return;

  try {
    const response = await fetch(`${APITeams}/deletememper/${selectedTeam.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailMembers: [email],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to remove member: ${response.status}`);
    }

    showMessage('Member removed successfully!');
    // Reload team details to reflect changes
    viewTeamDetails(selectedTeam.id);
  } catch (error) {
    console.error('Error removing member:', error);
    showMessage('Failed to remove member: ' + error.message, true);
  }
}

// Add member to team
async function addMemberToTeam(email) {
  try {
    const response = await fetch(`${APITeams}/${selectedTeam.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailMembers: [email],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to add member: ${response.status}`);
    }

    showMessage('Member added successfully!');
    // Reload team details to reflect changes
    viewTeamDetails(selectedTeam.id);
  } catch (error) {
    console.error('Error adding member:', error);
    showMessage('Failed to add member: ' + error.message, true);
  }
}

// Create team
createTeamForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const teamData = {
    name: formData.get('name'),
    description: formData.get('description'),
  };

  // Validate required fields
  if (!teamData.name || teamData.name.trim() === '') {
    showMessage('Team name is required', true);
    return;
  }

  // Add members if any
  if (teamMembers.length > 0) {
    teamData.emailMembers = teamMembers;
  }

  try {
    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.textContent = 'Creating...';
    submitBtn.disabled = true;

    const response = await fetch(APITeams, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to create team: ${response.status}`);
    }

    showMessage('Team created successfully!');
    createTeamForm.reset();
    membersTagsContainer.innerHTML = '';
    teamMembers = [];

    // Reload teams
    await loadTeams();
    switchToTab('my-teams');
  } catch (error) {
    console.error('Error creating team:', error);
    showMessage('Failed to create team: ' + error.message, true);
  } finally {
    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.textContent = 'Create Team';
    submitBtn.disabled = false;
  }
});

// Add member to team creation form
teamMembersInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const email = teamMembersInput.value.trim().toLowerCase();

    if (email && isValidEmail(email)) {
      if (!teamMembers.includes(email)) {
        teamMembers.push(email);
        renderMemberTags();
      }
      teamMembersInput.value = '';
    }
  }
});

// Render member tags in creation form
function renderMemberTags() {
  membersTagsContainer.innerHTML = '';
  teamMembers.forEach((email, index) => {
    const tag = document.createElement('div');
    tag.className = 'member-tag';
    tag.innerHTML = `
            ${email}
            <button type="button" class="remove-member" data-index="${index}">&times;</button>
        `;
    membersTagsContainer.appendChild(tag);
  });

  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-member').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      teamMembers.splice(index, 1);
      renderMemberTags();
    });
  });
}

// Email validation
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Tab switching
function switchToTab(tabId) {
  tabContents.forEach((tab) => {
    tab.classList.remove('active');
  });
  tabButtons.forEach((btn) => {
    btn.classList.remove('active');
  });

  document.getElementById(tabId).classList.add('active');

  // Find and activate the corresponding tab button
  const correspondingBtn = document.querySelector(`[data-tab="${tabId}"]`);
  if (correspondingBtn) {
    correspondingBtn.classList.add('active');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Tab buttons
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      switchToTab(btn.dataset.tab);
    });
  });

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
      await fetch(APILogout, {
        method: 'GET',
        credentials: 'include',
      });
      window.location.href = '/Login_v1/index.html';
    } catch (error) {
      console.error('Logout error:', error);
      alert('Logout failed: ' + error.message);
    }
  });

  // Back to tasks button
  const backToTasksBtn = document.getElementById('backToTasksBtn');
  if (backToTasksBtn) {
    backToTasksBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  // Team task modal close events
  teamTaskModal.querySelector('.close-modal').addEventListener('click', () => {
    teamTaskModal.classList.remove('active');
  });

  teamTaskModal.querySelector('.cancel-btn').addEventListener('click', () => {
    teamTaskModal.classList.remove('active');
  });

  teamTaskModal.addEventListener('click', (e) => {
    if (e.target === teamTaskModal) {
      teamTaskModal.classList.remove('active');
    }
  });

  // Delete team modal events
  deleteTeamModal.querySelector('.close-modal').addEventListener('click', () => {
    deleteTeamModal.classList.remove('active');
  });

  cancelDeleteTeamBtn.addEventListener('click', () => {
    deleteTeamModal.classList.remove('active');
  });

  confirmDeleteTeamBtn.addEventListener('click', () => {
    if (teamToDelete) {
      deleteTeam(teamToDelete);
    }
  });

  deleteTeamModal.addEventListener('click', (e) => {
    if (e.target === deleteTeamModal) {
      deleteTeamModal.classList.remove('active');
    }
  });

  // Transfer owner modal events (dynamic)
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-modal') && e.target.closest('#transferOwnerModal')) {
      document.getElementById('transferOwnerModal').classList.remove('active');
    }

    if (e.target.id === 'cancelTransferOwner') {
      document.getElementById('transferOwnerModal').classList.remove('active');
    }

    if (e.target.id === 'transferOwnerModal') {
      document.getElementById('transferOwnerModal').classList.remove('active');
    }
  });
}

// Show message function
function showMessage(message, isError = false) {
  const messageEl = document.createElement('div');
  messageEl.className = `delete-confirmation ${isError ? 'error' : 'update-success'}`;
  messageEl.textContent = message;
  document.body.appendChild(messageEl);

  setTimeout(() => {
    messageEl.remove();
  }, 3000);
}

// Show confirmation dialog
function showConfirmationDialog(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirmation-overlay active';

    const dialog = document.createElement('div');
    dialog.className = 'confirmation-dialog active';
    dialog.innerHTML = `
            <h3>Confirm Action</h3>
            <p>${message}</p>
            <div class="confirmation-buttons">
                <button class="cancel-btn">Cancel</button>
                <button class="confirm-btn">Confirm</button>
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
}
