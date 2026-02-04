// ========== ВСЁ В ОДНОМ ФАЙЛЕ ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Запуск приложения...');
    
    const STORAGE_KEY = 'todo-app-state';
    let isDragging = false;
    let currentTaskToDelete = null;
    let currentTaskToEdit = null;
    let isDeleteMode = false; // Режим удаления
    let isEditMode = false; // Режим редактирования
    
    // ===== 2. СОЗДАНИЕ ЗАДАЧИ =====
    function createTask(title, description = '', status = 'in-progress', addDate = false, isEdit = false, editDate = null) {
        const task = document.createElement('li');
        task.className = 'todo-app__task';
        task.draggable = true;
        
        // Убираем ВСЕ предыдущие обработчики клика
        task.onclick = null;
        
        // Добавляем обработчик клика
        task.addEventListener('click', function(e) {
            // Проверяем, что это не клик по дате
            if (!e.target.closest('.task__date')) {
                e.stopPropagation(); // Останавливаем всплытие
                e.preventDefault(); // Предотвращаем действия по умолчанию
                
                if (isDeleteMode) {
                    openDeleteModal(this);
                } else if (isEditMode) {
                    openEditModal(this);
                }
            }
        });
        
        // Безопасное создание HTML
        const titleEl = document.createElement('h4');
        titleEl.className = 'task__title';
        titleEl.textContent = title;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'task__content';
        contentDiv.appendChild(titleEl);
        
        if (description) {
            const descEl = document.createElement('p');
            descEl.className = 'task__description';
            descEl.textContent = description;
            contentDiv.appendChild(descEl);
        }
        
        // Добавляем дату
        let taskDate = null;
        if (addDate || isEdit) {
            if (isEdit && editDate) {
                // Используем сохраненную дату при редактировании
                taskDate = new Date(editDate);
            } else {
                // Создаем новую дату
                taskDate = new Date();
            }
            
            // Сохраняем дату в data-атрибут
            task.dataset.createdDate = taskDate.toISOString();
            
            // Создаем элемент для отображения даты
            const dateEl = document.createElement('div');
            dateEl.className = 'task__date';
            
            // Форматируем дату по-русски
            const formattedDate = taskDate.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            dateEl.innerHTML = `<span class="task__date-icon">📅</span> ${formattedDate}`;
            contentDiv.appendChild(dateEl);
        }
        
        task.appendChild(contentDiv);
        
        // Добавляем в нужную колонку
        const column = document.querySelector(`[data-status-target="${status}"]`);
        if (column) {
            column.appendChild(task);
        } else {
            document.querySelector('[data-status-target="in-progress"]').appendChild(task);
        }
        
        // Обновляем визуальные стили
        updateTaskStyles();
        
        // Сохраняем состояние
        saveState();
        
        return task;
    }
    
    // ===== 3. МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ =====
    function initDeleteModal() {
        const deleteModal = document.querySelector('.modal--confirm');
        const cancelBtn = deleteModal.querySelector('.modal__button--cancel');
        const deleteBtn = deleteModal.querySelector('.modal__button--delete');
        const overlay = deleteModal.querySelector('.modal__overlay');
        
        if (!deleteModal) {
            console.warn('⚠️ Модалка подтверждения не найдена');
            return;
        }
        
        // Открытие модалки подтверждения удаления
        window.openDeleteModal = function(taskElement) {
            currentTaskToDelete = taskElement;
            deleteModal.style.display = 'block';
            setTimeout(() => {
                deleteModal.classList.add('modal--open');
            }, 10);
        };
        
        // Закрытие модалки подтверждения
        function closeDeleteModal() {
            deleteModal.classList.remove('modal--open');
            setTimeout(() => {
                deleteModal.style.display = 'none';
                currentTaskToDelete = null;
            }, 300);
        }
        
        // Кнопка "Отмена"
        cancelBtn.addEventListener('click', function() {
            closeDeleteModal();
        });
        
        // Кнопка "Удалить"
        deleteBtn.addEventListener('click', function() {
            if (currentTaskToDelete) {
                // Удаляем задачу из DOM
                currentTaskToDelete.remove();
                // Сохраняем изменения
                saveState();
                closeDeleteModal();
                // Выходим из режима удаления
                exitDeleteMode();
            }
        });
        
        // Закрытие по overlay
        overlay.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                closeDeleteModal();
            }
        });
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && deleteModal.classList.contains('modal--open')) {
                closeDeleteModal();
            }
        });
    }
    
    // ===== 4. МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ =====
    function initEditModal() {
        const editModal = document.querySelector('.modal--edit');
        
        if (!editModal) {
            console.warn('⚠️ Модалка редактирования не найдена');
            return;
        }
        
        const cancelBtn = editModal.querySelector('.modal__button--cancel');
        const form = editModal.querySelector('.modal__form');
        const overlay = editModal.querySelector('.modal__overlay');
        
        // Открытие модалки редактирования
        window.openEditModal = function(taskElement) {
            currentTaskToEdit = taskElement;
            
            // Получаем данные задачи
            const title = taskElement.querySelector('.task__title')?.textContent || '';
            const description = taskElement.querySelector('.task__description')?.textContent || '';
            const hasDate = taskElement.querySelector('.task__date') !== null;
            const dateValue = taskElement.dataset.createdDate || '';
            
            // Заполняем форму данными
            form.querySelector('.modal__input--title').value = title;
            form.querySelector('.modal__textarea--description').value = description;
            form.querySelector('.modal__checkbox--date').checked = hasDate;
            
            // Сохраняем оригинальную дату в data-атрибут
            form.dataset.originalDate = dateValue;
            
            editModal.style.display = 'block';
            setTimeout(() => {
                editModal.classList.add('modal--open');
            }, 10);
        };
        
        // Закрытие модалки редактирования
        function closeEditModal() {
            editModal.classList.remove('modal--open');
            setTimeout(() => {
                editModal.style.display = 'none';
                currentTaskToEdit = null;
                form.reset();
                delete form.dataset.originalDate;
            }, 300);
        }
        
        // Обработка формы редактирования
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const title = this.querySelector('.modal__input--title').value.trim();
            const description = this.querySelector('.modal__textarea--description')?.value.trim() || '';
            const checkBox = this.querySelector('.modal__checkbox--date');
            const addDate = checkBox.checked;
            const originalDate = this.dataset.originalDate || null;
            
            if (!title) {
                alert('Введите название задачи');
                return;
            }
            
            if (currentTaskToEdit) {
                // Получаем текущий статус задачи (из какой колонки)
                const parentList = currentTaskToEdit.closest('.todo-app__tasks-list');
                const status = parentList ? parentList.dataset.statusTarget : 'in-progress';
                
                // Удаляем старую задачу
                currentTaskToEdit.remove();
                
                // Создаем новую задачу с обновленными данными
                createTask(title, description, status, addDate, true, originalDate);
                
                // Выходим из режима редактирования
                exitEditMode();
                
                // Закрываем модалку
                closeEditModal();
            }
        });
        
        // Кнопка "Отмена"
        cancelBtn.addEventListener('click', function() {
            closeEditModal();
            exitEditMode();
        });
        
        // Закрытие по overlay
        overlay.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                closeEditModal();
                exitEditMode();
            }
        });
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && editModal.classList.contains('modal--open')) {
                closeEditModal();
                exitEditMode();
            }
        });
    }
    
    // ===== 5. УПРАВЛЕНИЕ КНОПКАМИ =====
    function initControlButtons() {
        const deleteBtn = document.querySelector('.todo-app__delete');
        const editBtn = document.querySelector('.todo-app__edit');
        
        // Функция выхода из режима удаления
        function exitDeleteMode() {
            isDeleteMode = false;
            deleteBtn.style.backgroundColor = '';
            deleteBtn.style.color = '';
            deleteBtn.textContent = '🗑 Удалить';
            updateTaskStyles();
        }
        
        window.exitDeleteMode = exitDeleteMode;
        
        // Функция выхода из режима редактирования
        function exitEditMode() {
            isEditMode = false;
            editBtn.style.backgroundColor = '';
            editBtn.style.color = '';
            editBtn.textContent = '✎ Изменить';
            updateTaskStyles();
        }
        
        window.exitEditMode = exitEditMode;
        
        // Функция сброса других режимов
        function resetOtherModes(currentMode) {
            if (currentMode !== 'delete' && isDeleteMode) {
                exitDeleteMode();
            }
            if (currentMode !== 'edit' && isEditMode) {
                exitEditMode();
            }
        }
        
        // Кнопка "Удалить"
        deleteBtn.addEventListener('click', function() {
            resetOtherModes('delete');
            isDeleteMode = !isDeleteMode; // Переключаем режим
            
            if (isDeleteMode) {
                // Активируем режим удаления
                deleteBtn.style.backgroundColor = '#ff4444';
                deleteBtn.style.color = 'white';
                deleteBtn.textContent = '🗑 Режим удаления';
            } else {
                // Деактивируем режим удаления
                exitDeleteMode();
            }
            
            // Обновляем стили задач
            updateTaskStyles();
        });
        
        // Кнопка "Изменить"
        editBtn.addEventListener('click', function() {
            resetOtherModes('edit');
            isEditMode = !isEditMode; // Переключаем режим
            
            if (isEditMode) {
                // Активируем режим редактирования
                editBtn.style.backgroundColor = '#4a6fa5';
                editBtn.style.color = 'white';
                editBtn.textContent = '✎ Режим редактирования';
            } else {
                // Деактивируем режим редактирования
                exitEditMode();
            }
            
            // Обновляем стили задач
            updateTaskStyles();
        });
    }
    
    // ===== 6. ОБНОВЛЕНИЕ СТИЛЕЙ ЗАДАЧ =====
    function updateTaskStyles() {
        const tasks = document.querySelectorAll('.todo-app__task');
        
        tasks.forEach(task => {
            // Сбрасываем все стили
            task.style.cursor = '';
            task.style.backgroundColor = '';
            task.style.border = '';
            task.style.boxShadow = '';
            
            if (isDeleteMode) {
                task.style.cursor = 'pointer';
                task.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
                task.style.border = '2px solid #ff4444';
            } else if (isEditMode) {
                task.style.cursor = 'pointer';
                task.style.backgroundColor = 'rgba(74, 111, 165, 0.1)';
                task.style.border = '2px solid #4a6fa5';
            }
        });
    }
    
    // ===== 7. СОХРАНЕНИЕ В LOCALSTORAGE =====
    function saveState() {
        const state = {
            completed: [],
            'in-progress': [],
            postponed: []
        };
        
        document.querySelectorAll('.todo-app__tasks-list').forEach(list => {
            const status = list.dataset.statusTarget;
            const tasks = [];
            
            list.querySelectorAll('.todo-app__task').forEach(task => {
                const title = task.querySelector('.task__title')?.textContent || '';
                const description = task.querySelector('.task__description')?.textContent || '';
                const dateElement = task.querySelector('.task__date');
                
                const taskData = {
                    title: title.trim(),
                    description: description.trim(),
                    hasDate: !!dateElement,
                    createdDate: task.dataset.createdDate || null
                };
                
                tasks.push(taskData);
            });
            
            if (state[status] !== undefined) {
                state[status] = tasks;
            }
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        console.log('💾 Состояние сохранено');
    }
    
    // ===== 8. ЗАГРУЗКА ИЗ LOCALSTORAGE =====
    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return;
            
            const state = JSON.parse(saved);
            
            document.querySelectorAll('.todo-app__tasks-list').forEach(list => {
                list.innerHTML = '';
            });
            
            Object.keys(state).forEach(status => {
                const list = document.querySelector(`[data-status-target="${status}"]`);
                if (list && Array.isArray(state[status])) {
                    state[status].forEach(taskData => {
                        if (taskData.title && taskData.title.trim() !== '') {
                            createTask(
                                taskData.title, 
                                taskData.description, 
                                status, 
                                taskData.hasDate
                            );
                        }
                    });
                }
            });
            
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            localStorage.removeItem(STORAGE_KEY);
        }
    }
    
    // ===== 1. МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ =====
    function initAddModal() {
        const modal = document.querySelector('.modal:not(.modal--confirm):not(.modal--edit)');
        const openBtn = document.querySelector('.todo-app__add');
        const form = modal.querySelector('.modal__form');
        
        if (!modal || !openBtn || !form) {
            console.warn('⚠️ Элементы модалки не найдены');
            return;
        }
        
        function closeModal() {
            modal.classList.remove('modal--open');
        }
        
        openBtn.addEventListener('click', () => {
            modal.classList.add('modal--open');
        });
        
        modal.querySelector('.modal__overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                closeModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('modal--open')) {
                closeModal();
            }
        });
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const title = this.querySelector('.modal__input').value.trim();
            const description = this.querySelector('.modal__textarea')?.value.trim() || '';
            const checkBox = this.querySelector('.modal__checkbox');
            const addDate = checkBox.checked;
            
            if (!title) {
                alert('Введите название задачи');
                return;
            }
            
            createTask(title, description, 'in-progress', addDate);
            closeModal();
            this.reset();
        });
    }
    
    // ===== 9. DRAGULA (перетаскивание) =====
    function initDragula() {
        const taskLists = document.querySelectorAll('.todo-app__tasks-list');
        const drake = dragula(Array.from(taskLists), {
            moves: function(el, source, handle, sibling) {
                return el.classList.contains('todo-app__task');
            }
        });
        
        drake.on('drag', function(el) {
            isDragging = true;
            el.style.opacity = '0.5';
        });
        
        drake.on('dragend', function(el) {
            isDragging = false;
            el.style.opacity = '1';
        });
        
        drake.on('drop', function() {
            saveState();
        });
        
        document.addEventListener('touchmove', function(e) {
            if (isDragging && e.touches.length === 1) {
                const touch = e.touches[0];
                const windowHeight = window.innerHeight;
                const scrollZone = 100;
                
                if (touch.clientY > windowHeight - scrollZone) {
                    window.scrollBy({ top: 10, behavior: 'smooth' });
                } else if (touch.clientY < scrollZone) {
                    window.scrollBy({ top: -10, behavior: 'smooth' });
                }
            }
        }, { passive: true });
    }
    
    // ===== 10. ЗАПУСК ВСЕГО =====
    initDeleteModal(); // Инициализируем модалку удаления
    initEditModal(); // Инициализируем модалку редактирования
    initAddModal();
    loadState();
    initDragula();
    initControlButtons();
    
    window.addEventListener('beforeunload', saveState);
    
    console.log('✅ Приложение запущено!');
});