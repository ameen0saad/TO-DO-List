// API endpoints
const APITeams = 'https://to-do-list-production-5d26.up.railway.app/api/v1/teams';
const APITeamTasks = 'https://to-do-list-production-5d26.up.railway.app/api/v1/teamTasks';
const APIUser = 'https://to-do-list-production-5d26.up.railway.app/api/v1/users/me';
const APILogout = 'https://to-do-list-production-5d26.up.railway.app/api/v1/users/logout';

// Global variables
let currentUser = null;
let selectedTeam = null;

// DOM elements
const teamName = document.getElementById('teamName');
const teamDescription = document.getElementById('teamDescription');
const teamRole = document.getElementById('teamRole');
const addMemberSection = document.getElementById('addMemberSection');
const addMemberInput = document.getElementById('addMemberInput');
const addMemberBtn = document.getElementById('addMemberBtn');
const membersListSidebar = document.getElementById('membersListSidebar');
const teamManagementActions = document.getElementById('teamManagementActions');
const dangerZoneSidebar = document.getElementById('dangerZoneSidebar');
const addTeamTask = document.getElementById('addTeamTask');
const teamTasksContainer = document.getElementById('teamTasksContainer');
const teamTaskModal = document.getElementById('teamTaskModal');
const teamTaskForm = document.getElementById('teamTaskForm');
const deleteTeamModal = document.getElementById('deleteTeamModal');
const cancelDeleteTeamBtn = document.getElementById('cancelDeleteTeam');
const confirmDeleteTeamBtn = document.getElementById('confirmDeleteTeam');
const transferOwnerModal = document.getElementById('transferOwnerModal');
const transferMembersList = document.getElementById('transferMembersList');
const cancelTransferOwnerBtn = document.getElementById('cancelTransferOwner');
const backToTeamsBtn = document.getElementById('backToTeams');
const logoutBtn = document.getElementById('logoutBtn');

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
  await loadUserData();

  // Get team ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('teamId');

  if (teamId) {
    await viewTeamDetails(teamId);
  } else {
    showMessage('No team specified', true);
    teamTasksContainer.innerHTML =
      '<div class="error">No team specified. Please go back to teams and select a team.</div>';
  }

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
    displayTeamDetails();
  } catch (error) {
    console.error('Error loading team details:', error);
    showMessage('Failed to load team details: ' + error.message, true);
  }
}

// Display team details with sidebar layout
function displayTeamDetails() {
  if (!selectedTeam) return;
  const isOwner = selectedTeam.ownerId === currentUser.id;

  // Update team header
  teamName.textContent = selectedTeam.name;
  teamDescription.textContent = selectedTeam.description || 'No description provided';
  teamRole.textContent = isOwner ? 'Team Owner' : 'Team Member';

  // Show/hide owner-only sections
  if (isOwner) {
    addMemberSection.style.display = 'block';
    teamManagementActions.style.display = 'block';
    dangerZoneSidebar.style.display = 'block';
    addTeamTask.style.display = 'block';
  } else {
    addMemberSection.style.display = 'none';
    teamManagementActions.style.display = 'none';
    dangerZoneSidebar.style.display = 'none';
    addTeamTask.style.display = 'none';
  }

  // Render members list
  renderMembersList();

  // Load team tasks
  loadTeamTasks(selectedTeam.id);
}

// Render members list in sidebar
function renderMembersList() {
  if (!selectedTeam) return;
  const isOwner = selectedTeam.ownerId === currentUser.id;

  membersListSidebar.innerHTML = selectedTeam.user
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
                                ${member.id === selectedTeam.ownerId ? 'Owner' : 'Member'}
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
    .join('');

  // Add event listeners to remove member buttons
  document.querySelectorAll('.remove-member-btn-sidebar').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const email = e.target.dataset.email;
      removeMemberFromTeam(email);
    });
  });
}

// Load team tasks
async function loadTeamTasks(teamId) {
  try {
    // Build query parameters based on filter
    const queryParams = new URLSearchParams();
    const filter = 'all';
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

    const response = await fetch(`${APITeamTasks}/${teamId}?${queryParams.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`Failed to load team tasks: ${response.status}`);
    }

    const data = await response.json();
    console.log(data.data.result);
    renderTeamTasks(data.data.result.data || []);
  } catch (error) {
    console.error('Error loading team tasks:', error);
    teamTasksContainer.innerHTML = `<div class="error">Error loading tasks: ${error.message}</div>`;
  }
}

// Render team tasks as cards with permission-based buttons
function renderTeamTasks(tasks) {
  const isOwner = selectedTeam.ownerId === currentUser.id;

  if (tasks.length === 0) {
    teamTasksContainer.innerHTML = `
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

  teamTasksContainer.innerHTML = `
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
                                                        ${new Date(
                                                          task.createdAt
                                                        ).toLocaleDateString()}
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
          // Instead of updating UI manually, reload the tasks to refresh everything
          loadTeamTasks(selectedTeam.id);

          // Show success message
          showMessage(`Task marked as ${e.target.checked ? 'completed' : 'incomplete'}!`);
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

// Show team task modal with enhanced form - SIMPLIFIED VERSION
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

  // Create a one-time event handler
  const handleSubmitOnce = async (e) => {
    e.preventDefault();

    // Remove this event listener after first use
    form.removeEventListener('submit', handleSubmitOnce);

    // Get form values
    const title = document.getElementById('teamTaskTitle').value;
    const description = document.getElementById('teamTaskDescription').value;
    const priority = document.getElementById('teamTaskPriority').value;
    const status = document.getElementById('teamTaskStatus').value;
    const dueDate = document.getElementById('teamTaskDueDate').value;

    let taskData = {};

    if (isEdit && !isOwner) {
      taskData = { status: status.toUpperCase() };
    } else {
      taskData = {
        title: title,
        description: description,
        priority: priority.toUpperCase(),
        status: status.toUpperCase(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      };
    }

    // Validate required fields
    if ((isOwner || !isEdit) && !taskData.title.trim()) {
      showMessage('Task title is required', true);
      // Re-add the event listener since we removed it
      form.addEventListener('submit', handleSubmitOnce);
      return;
    }

    try {
      submitBtn.textContent = 'Saving...';
      //submitBtn.disabled = true;

      if (isEdit) {
        console.log(task);
        console.log(taskData);
        await updateTeamTask(task.id, taskData);
        showMessage('Task updated successfully!');
      } else {
        await createTeamTask(taskData);
        showMessage('Task created successfully!');
      }

      modal.classList.remove('active');
      loadTeamTasks(selectedTeam.id);
    } catch (error) {
      console.error('Error saving task:', error);
      showMessage('Failed to save task: ' + error.message, true);
      submitBtn.textContent = isEdit ? 'Update Task' : 'Create Task';
      submitBtn.disabled = false;
      // Re-add the event listener on error
      form.addEventListener('submit', handleSubmitOnce);
    }
  };

  // Add the one-time event listener
  form.addEventListener('submit', handleSubmitOnce);
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

// Delete team (for owners only)
async function deleteTeam() {
  try {
    const response = await fetch(`${APITeams}/${selectedTeam.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to delete team: ${response.status}`);
    }

    showMessage('Team deleted successfully!');
    // Redirect back to teams page
    window.location.href = 'teams.html';
  } catch (error) {
    console.error('Error deleting team:', error);
    showMessage('Failed to delete team: ' + error.message, true);
  }
}

// Show delete team confirmation modal
function showDeleteTeamModal() {
  deleteTeamModal.classList.add('active');
}

// Show transfer owner modal
function showTransferOwnerModal() {
  // Populate members list
  const transferableMembers = selectedTeam.user.filter(
    (member) => member.id !== selectedTeam.ownerId
  );

  if (transferableMembers.length === 0) {
    transferMembersList.innerHTML =
      '<p class="no-members-message">No other team members available for transfer.</p>';
  } else {
    transferMembersList.innerHTML = transferableMembers
      .map(
        (member) => `
                        <div class="transfer-member-item">
                            <div class="transfer-member-info">
                                <div class="member-avatar-sidebar">${member.name
                                  .charAt(0)
                                  .toUpperCase()}</div>
                                <div class="member-details">
                                    <div class="member-name-sidebar">${member.name}</div>
                                    <div class="member-email-sidebar">${member.email}</div>
                                </div>
                            </div>
                            <button class="transfer-owner-confirm-btn" data-member-id="${
                              member.id
                            }" data-member-name="${member.name}" >
                                Transfer
                            </button>
                        </div>
                    `
      )
      .join('');

    // Add event listeners to transfer buttons
    document.querySelectorAll('.transfer-owner-confirm-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        console.log(e.target);
        const memberId = e.target.dataset.memberId;
        const memberName = e.target.dataset.memberName;
        transferOwnership(memberId, memberName);
      });
    });
  }

  transferOwnerModal.classList.add('active');
}

// Transfer ownership
async function transferOwnership(memberId, memberName) {
  const confirmed = await showConfirmationDialog(
    `Are you sure you want to transfer ownership to ${memberName}? You will become a regular member of the team.`
  );

  if (!confirmed) return;
  console.log(selectedTeam);
  try {
    const response = await fetch(`${APITeams}/transfareOwner/${selectedTeam.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idMember: memberId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to transfer ownership: ${response.status}`);
    }

    showMessage(`Ownership transferred successfully to ${memberName}!`);

    // Close modal
    transferOwnerModal.classList.remove('active');

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

// Email validation
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Setup event listeners
function setupEventListeners() {
  // Back to teams button
  backToTeamsBtn.addEventListener('click', () => {
    window.location.href = 'teams.html';
  });

  // Logout button
  logoutBtn.addEventListener('click', async () => {
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

  // Add member button
  addMemberBtn.addEventListener('click', () => {
    const email = addMemberInput.value.trim().toLowerCase();
    if (email && isValidEmail(email)) {
      addMemberToTeam(email);
      addMemberInput.value = '';
    } else {
      showMessage('Please enter a valid email address', true);
    }
  });

  // Allow pressing Enter to add member
  addMemberInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMemberBtn.click();
    }
  });

  // Add task button
  addTeamTask.addEventListener('click', () => {
    showTeamTaskModal();
  });

  // Delete team button
  document.getElementById('deleteTeamBtn').addEventListener('click', () => {
    showDeleteTeamModal();
  });

  // Transfer ownership button
  document.getElementById('transferOwnershipBtn').addEventListener('click', () => {
    showTransferOwnerModal();
  });

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
    deleteTeam();
  });

  deleteTeamModal.addEventListener('click', (e) => {
    if (e.target === deleteTeamModal) {
      deleteTeamModal.classList.remove('active');
    }
  });

  // Transfer owner modal events
  transferOwnerModal.querySelector('.close-modal').addEventListener('click', () => {
    transferOwnerModal.classList.remove('active');
  });

  cancelTransferOwnerBtn.addEventListener('click', () => {
    transferOwnerModal.classList.remove('active');
  });

  transferOwnerModal.addEventListener('click', (e) => {
    if (e.target === transferOwnerModal) {
      transferOwnerModal.classList.remove('active');
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
// Show confirmation dialog
function showConfirmationDialog(message) {
  return new Promise((resolve) => {
    // Create overlay first
    const overlay = document.createElement('div');
    overlay.className = 'confirmation-overlay';

    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'confirmation-dialog';
    dialog.innerHTML = `
      <h3>Confirm Action</h3>
      <p>${message}</p>
      <div class="confirmation-buttons">
        <button class="cancel-btn">Cancel</button>
        <button class="confirm-btn">Confirm</button>
      </div>
    `;

    // Add both to DOM first
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);

    // Use setTimeout to ensure DOM is updated before adding active class
    setTimeout(() => {
      overlay.classList.add('active');
      dialog.classList.add('active');
    }, 10);

    const confirmBtn = dialog.querySelector('.confirm-btn');
    const cancelBtn = dialog.querySelector('.cancel-btn');

    const cleanup = () => {
      overlay.classList.remove('active');
      dialog.classList.remove('active');

      // Remove elements after transition
      setTimeout(() => {
        overlay.remove();
        dialog.remove();
      }, 300);
    };

    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    confirmBtn.onclick = handleConfirm;
    cancelBtn.onclick = handleCancel;

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        handleCancel();
      }
    };

    // Also handle Escape key
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
        document.removeEventListener('keydown', handleKeydown);
      }
    };

    document.addEventListener('keydown', handleKeydown);

    // Remove keydown listener when dialog is closed
    setTimeout(() => {
      overlay.addEventListener('transitionend', () => {
        if (!overlay.classList.contains('active')) {
          document.removeEventListener('keydown', handleKeydown);
        }
      });
    }, 10);
  });
}

const backToTasks = document.getElementById('backToTasksBtn');
backToTasks.addEventListener('click', () => {
  window.location.href = 'Dashboard/index.html';
});
