// ========== ВСЁ В ОДНОМ ФАЙЛЕ ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Запуск приложения...');
    
    const STORAGE_KEY = 'todo-app-state';
    let isDragging = false;
    
    // ===== 1. МОДАЛЬНОЕ ОКНО =====
    function initModal() {
        const modal = document.querySelector('.modal');
        const openBtn = document.querySelector('.todo-app__add');
        const form = document.querySelector('.modal__form');
        
        if (!modal || !openBtn || !form) {
            console.warn('⚠️ Элементы модалки не найдены');
            return;
        }
        
        // Открытие
        openBtn.addEventListener('click', () => {
            modal.classList.add('modal--open');
        });
        
        // Закрытие по overlay
        modal.querySelector('.modal__overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                closeModal();
            }
        });
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('modal--open')) {
                closeModal();
            }
        });
        
        // Обработка формы
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const title = this.querySelector('.modal__input').value.trim();
            const description = this.querySelector('.modal__textarea')?.value.trim() || '';
            
            if (!title) {
                alert('Введите название задачи');
                return;
            }
            
            // Создаём задачу
            createTask(title, description);
            
            // Закрываем и чистим
            closeModal();
            this.reset();
        });
        
        function closeModal() {
            modal.classList.remove('modal--open');
        }
    }
    
    // ===== 2. СОЗДАНИЕ ЗАДАЧИ =====
    function createTask(title, description = '', status = 'in-progress') {
        const task = document.createElement('li');
        task.className = 'todo-app__task';
        task.draggable = true;
        
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
        
        task.appendChild(contentDiv);
        
        // Добавляем в нужную колонку
        const column = document.querySelector(`[data-status-target="${status}"]`);
        if (column) {
            column.appendChild(task);
        } else {
            // По умолчанию в "Выполняются"
            document.querySelector('[data-status-target="in-progress"]').appendChild(task);
        }
        
        // Сохраняем состояние
        saveState();
        
        return task;
    }
    
    // ===== 3. СОХРАНЕНИЕ В LOCALSTORAGE =====
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
                
                tasks.push({
                    title: title.trim(),
                    description: description.trim()
                });
            });
            
            if (state[status] !== undefined) {
                state[status] = tasks;
            }
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        console.log('💾 Состояние сохранено');
    }
    
    // ===== 4. ЗАГРУЗКА ИЗ LOCALSTORAGE =====
    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return;
            
            const state = JSON.parse(saved);
            
            // Очищаем колонки
            document.querySelectorAll('.todo-app__tasks-list').forEach(list => {
                list.innerHTML = '';
            });
            
            // Восстанавливаем задачи
            Object.keys(state).forEach(status => {
                const list = document.querySelector(`[data-status-target="${status}"]`);
                if (list && Array.isArray(state[status])) {
                    state[status].forEach(taskData => {
                        if (taskData.title && taskData.title.trim() !== '') {
                            createTask(taskData.title, taskData.description, status);
                        }
                    });
                }
            });
            
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            localStorage.removeItem(STORAGE_KEY);
        }
    }
    
    // ===== 5. DRAGULA (перетаскивание) =====
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
            saveState(); // Сохраняем после перетаскивания
        });
        
        // Автоскролл при перетаскивании
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
    
    // ===== 6. КНОПКИ УПРАВЛЕНИЯ =====
    function initControlButtons() {
        const buttons = document.querySelectorAll('.todo-app__delete, .todo-app__edit');
        
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                alert('Будет реализовано позже!');
            });
        });
    }
    
    // ===== 7. ЗАПУСК ВСЕГО =====
    initModal();
    loadState();
    initDragula();
    initControlButtons();
    
    window.addEventListener('beforeunload', saveState);
    
    console.log('✅ Приложение запущено!');
});