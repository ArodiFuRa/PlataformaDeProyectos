const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();  // Usa Router en vez de app directamente

// Middleware para parsear JSON
router.use(express.json());

// Archivo de datos
const usersFile = path.join(__dirname, 'data', 'users.json');
const projectsFile = path.join(__dirname, 'data', 'projects.json');
const tasksFile = path.join(__dirname, 'data', 'tasks_list.json');

// Ruta para registrar y autenticar usuarios
router.post('/auth', (req, res) => {
    const { action, email, password, name, role } = req.body;

    if (action === 'register') {
        fs.readFile(usersFile, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ status: 'error', message: 'Error al leer el archivo de usuarios' });
            }
            let users = JSON.parse(data);
            if (users.find(u => u.email === email)) {
                return res.json({ status: 'error', message: 'El correo ya está registrado' });
            }
            users.push({ name, email, password, role });
            fs.writeFile(usersFile, JSON.stringify(users, null, 2), err => {
                if (err) {
                    return res.status(500).json({ status: 'error', message: 'Error al guardar el archivo de usuarios' });
                }
                res.json({ status: 'success', message: 'Registro exitoso' });
            });
        });
    } else if (action === 'login') {
        fs.readFile(usersFile, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ status: 'error', message: 'Error al leer el archivo de usuarios' });
            }
            let users = JSON.parse(data);
            const user = users.find(u => u.email === email && u.password === password);
            if (user) {
                res.json({ status: 'success', message: 'Inicio de sesión exitoso', user });
            } else {
                res.json({ status: 'error', message: 'Credenciales inválidas' });
            }
        });
    } else {
        res.status(400).json({ status: 'error', message: 'Acción no válida' });
    }
});

// Ruta para obtener todos los proyectos
router.get('/projects', (req, res) => {
    fs.readFile(projectsFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer el archivo de proyectos' });
        }
        res.json(JSON.parse(data));
    });
});

// Ruta para crear un proyecto
router.post('/projects', (req, res) => {
    const { action, name, description } = req.body;

    if (action === 'create') {
        fs.readFile(projectsFile, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ error: 'Error al leer el archivo de proyectos' });
            }
            let projects = JSON.parse(data);
            const projectId = (projects.length + 1).toString(); // Crear un ID único simple
            projects.push({ id: projectId, name, description });
            fs.writeFile(projectsFile, JSON.stringify(projects, null, 2), err => {
                if (err) {
                    return res.status(500).json({ error: 'Error al guardar el archivo de proyectos' });
                }
                res.json({ status: 'success', message: 'Proyecto creado con éxito.' });
            });
        });
    } else {
        res.status(400).json({ status: 'error', message: 'Acción no válida.' });
    }
});

// Ruta para editar un proyecto
router.put('/projects/:id', (req, res) => {
    const projectId = req.params.id;
    const { name, description } = req.body;

    fs.readFile(projectsFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer el archivo de proyectos' });
        }
        let projects = JSON.parse(data);
        const project = projects.find(p => p.id === projectId);
        if (project) {
            project.name = name || project.name;
            project.description = description || project.description;
            fs.writeFile(projectsFile, JSON.stringify(projects, null, 2), err => {
                if (err) {
                    return res.status(500).json({ error: 'Error al guardar el archivo de proyectos' });
                }
                res.json({ status: 'success', message: 'Proyecto actualizado con éxito.' });
            });
        } else {
            res.status(404).json({ status: 'error', message: 'Proyecto no encontrado.' });
        }
    });
});

// Ruta para eliminar un proyecto
router.delete('/projects/:id', (req, res) => {
    const projectId = req.params.id;

    fs.readFile(projectsFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer el archivo de proyectos' });
        }
        let projects = JSON.parse(data);
        projects = projects.filter(p => p.id !== projectId);
        fs.writeFile(projectsFile, JSON.stringify(projects, null, 2), err => {
            if (err) {
                return res.status(500).json({ error: 'Error al guardar el archivo de proyectos' });
            }
            res.json({ status: 'success', message: 'Proyecto eliminado con éxito.' });
        });
    });
});

// Ruta para obtener todas las tareas
router.get('/tasks', (req, res) => {
    fs.readFile(tasksFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer el archivo de tareas' });
        }
        fs.readFile(projectsFile, 'utf8', (err, projectsData) => {
            if (err) {
                return res.status(500).json({ error: 'Error al leer el archivo de proyectos' });
            }
            const projects = JSON.parse(projectsData);
            let tasks = JSON.parse(data);

            // Asignar nombres de proyectos a las tareas
            tasks = tasks.map(task => {
                const project = projects.find(p => p.id === task.projectId);
                return {
                    ...task,
                    projectName: project ? project.name : 'Sin proyecto'
                };
            });

            res.json(tasks);
        });
    });
});

// Ruta para crear una tarea
router.post('/tasks', (req, res) => {
    const { action, title, projectId, description } = req.body;

    if (action === 'create') {
        fs.readFile(tasksFile, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ error: 'Error al leer el archivo de tareas' });
            }
            let tasks = JSON.parse(data);
            const taskId = (tasks.length + 1).toString(); // Crear un ID único simple
            tasks.push({ id: taskId, title, projectId, description });
            fs.writeFile(tasksFile, JSON.stringify(tasks, null, 2), err => {
                if (err) {
                    return res.status(500).json({ error: 'Error al guardar el archivo de tareas' });
                }
                res.json({ status: 'success', message: 'Tarea creada con éxito.' });
            });
        });
    } else {
        res.status(400).json({ status: 'error', message: 'Acción no válida.' });
    }
});

// Ruta para editar una tarea
router.put('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const { title, projectId, description } = req.body;

    fs.readFile(tasksFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer el archivo de tareas' });
        }
        let tasks = JSON.parse(data);
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.title = title || task.title;
            task.projectId = projectId || task.projectId;
            task.description = description || task.description;
            fs.writeFile(tasksFile, JSON.stringify(tasks, null, 2), err => {
                if (err) {
                    return res.status(500).json({ error: 'Error al guardar el archivo de tareas' });
                }
                res.json({ status: 'success', message: 'Tarea actualizada con éxito.' });
            });
        } else {
            res.status(404).json({ status: 'error', message: 'Tarea no encontrada.' });
        }
    });
});

// Ruta para eliminar una tarea
router.delete('/tasks/:id', (req, res) => {
    const taskId = req.params.id;

    fs.readFile(tasksFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer el archivo de tareas' });
        }
        let tasks = JSON.parse(data);
        tasks = tasks.filter(t => t.id !== taskId);
        fs.writeFile(tasksFile, JSON.stringify(tasks, null, 2), err => {
            if (err) {
                return res.status(500).json({ error: 'Error al guardar el archivo de tareas' });
            }
            res.json({ status: 'success', message: 'Tarea eliminada con éxito.' });
        });
    });
});

module.exports = router;