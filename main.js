document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const createProjectForm = document.getElementById('createProjectForm');
    const createTaskForm = document.getElementById('createTaskForm');
    const logoutButton = document.getElementById('logoutButton');
    const editProjectModal = document.getElementById('editProjectModal');
    const editTaskModal = document.getElementById('editTaskModal');
    const closeEditProjectModalButton = document.getElementById('closeEditProjectModal');
    const closeEditTaskModalButton = document.getElementById('closeEditTaskModal');

    // Mostrar nombre del usuario
    const displayUserName = (name) => {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = `Hola, ${name}!`;
        }
    };

    // Función para limpiar los campos de formulario
    const clearForm = (form) => {
        form.reset();
    };

    // Inicializar la interfaz de usuario
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    if (token) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('projects-section').style.display = 'block';
        if (userName) {
            displayUserName(userName);
        }
        loadProjects();
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userName', data.user.name); // Guardar nombre del usuario
                document.getElementById('auth-section').style.display = 'none';
                document.getElementById('projects-section').style.display = 'block';
                displayUserName(data.user.name); // Mostrar nombre del usuario
                loadProjects();
                clearForm(loginForm); // Limpiar campos de inicio de sesión
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un error al iniciar sesión. Por favor, inténtelo de nuevo.');
        });
    });

    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const role = document.getElementById('registerRole').value;
    
        fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'register', name, email, password, role })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert(data.message);
                clearForm(registerForm); // Limpiar campos de registro
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Hubo un error al registrarse. Por favor, inténtelo de nuevo.');
        });
    });

    // Funciones para manejar proyectos y tareas

    function loadProjects() {
        fetch('/api/projects')
        .then(response => response.json())
        .then(data => {
            const projectsList = document.getElementById('projectsList');
            const taskProject = document.getElementById('taskProject');
            projectsList.innerHTML = '';
            taskProject.innerHTML = '<option value="">Selecciona un proyecto</option>'; // Reset options

            data.forEach(project => {
                const li = document.createElement('li');
                li.innerHTML = `${project.name} - ${project.description}`;

                const editButton = document.createElement('button');
                editButton.textContent = 'Editar';
                editButton.classList.add('edit-button'); // Añadido para aplicar estilos
                editButton.addEventListener('click', () => openEditProjectModal(project));
                li.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Eliminar';
                deleteButton.classList.add('delete-button'); // Añadido para aplicar estilos
                deleteButton.addEventListener('click', () => deleteProject(project.id));
                li.appendChild(deleteButton);

                projectsList.appendChild(li);

                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                taskProject.appendChild(option);
            });

            loadTasks();
        });
    }

    function loadTasks() {
        fetch('/api/tasks')
        .then(response => response.json())
        .then(data => {
            const tasksList = document.getElementById('tasksList');
            tasksList.innerHTML = '';

            data.forEach(task => {
                // Buscar el nombre del proyecto correspondiente
                const projectName = task.projectId ? getProjectNameById(task.projectId) : 'No asignado';

                const li = document.createElement('li');
                li.innerHTML = `${task.title} - ${task.description} - Proyecto: ${projectName}`;

                const editButton = document.createElement('button');
                editButton.textContent = 'Editar';
                editButton.classList.add('edit-button'); // Añadido para aplicar estilos
                editButton.addEventListener('click', () => openEditTaskModal(task));
                li.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Eliminar';
                deleteButton.classList.add('delete-button'); // Añadido para aplicar estilos
                deleteButton.addEventListener('click', () => deleteTask(task.id));
                li.appendChild(deleteButton);

                tasksList.appendChild(li);
            });
        });
    }

    // Buscar nombre del proyecto por ID
    function getProjectNameById(projectId) {
        const projects = Array.from(document.getElementById('taskProject').options);
        const project = projects.find(option => option.value == projectId);
        return project ? project.text : 'No asignado';
    }

    function openEditProjectModal(project) {
        document.getElementById('editProjectId').value = project.id;
        document.getElementById('editProjectName').value = project.name;
        document.getElementById('editProjectDescription').value = project.description;
        editProjectModal.style.display = 'block';
    }

    function closeEditProjectModal() {
        editProjectModal.style.display = 'none';
    }

    function openEditTaskModal(task) {
        document.getElementById('editTaskId').value = task.id;
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDescription').value = task.description;
        document.getElementById('taskProject').value = task.projectId || ''; // Asignar el proyecto actual
        editTaskModal.style.display = 'block';
    }

    function closeEditTaskModal() {
        editTaskModal.style.display = 'none';
    }

    document.getElementById('editProjectForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('editProjectId').value;
        const name = document.getElementById('editProjectName').value;
        const description = document.getElementById('editProjectDescription').value;

        fetch(`/api/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description })
        })
        .then(response => response.json())
        .then(() => {
            closeEditProjectModal();
            loadProjects();
        })
        .catch(error => console.error('Error:', error));
    });

    document.getElementById('editTaskForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const id = document.getElementById('editTaskId').value;
        const title = document.getElementById('editTaskTitle').value;
        const description = document.getElementById('editTaskDescription').value;
        const projectId = document.getElementById('taskProject').value;

        fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, projectId })
        })
        .then(response => response.json())
        .then(() => {
            closeEditTaskModal();
            loadTasks();
        })
        .catch(error => console.error('Error:', error));
    });

    createProjectForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('projectName').value;
        const description = document.getElementById('projectDescription').value;

        fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', name, description })
        })
        .then(response => response.json())
        .then(() => {
            loadProjects();
            clearForm(createProjectForm);
        })
        .catch(error => console.error('Error:', error));
    });

    createTaskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const title = document.getElementById('taskTitle').value;
        const projectId = document.getElementById('taskProject').value;
        const description = document.getElementById('taskDescription').value;

        fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', title, projectId, description })
        })
        .then(response => response.json())
        .then(() => {
            loadTasks();
            clearForm(createTaskForm);
        })
        .catch(error => console.error('Error:', error));
    });

    function deleteProject(id) {
        fetch(`/api/projects/${id}`, {
            method: 'DELETE'
        })
        .then(() => loadProjects())
        .catch(error => console.error('Error:', error));
    }

    function deleteTask(id) {
        fetch(`/api/tasks/${id}`, {
            method: 'DELETE'
        })
        .then(() => loadTasks())
        .catch(error => console.error('Error:', error));
    }

    logoutButton.addEventListener('click', function() {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('projects-section').style.display = 'none';
    });

    closeEditProjectModalButton.addEventListener('click', closeEditProjectModal);
    closeEditTaskModalButton.addEventListener('click', closeEditTaskModal);
});