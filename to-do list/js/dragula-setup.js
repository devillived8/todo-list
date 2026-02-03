// ========== DRAGULA + LOCALSTORAGE ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Инициализация Dragula и LocalStorage...');
    
    const STORAGE_KEY = 'todo-app-state';
    
    // 1. Функция сохранения состояния
    function saveState() {
        const state = {
            completed: [],
            'in-progress': [],
            postponed: []
        };
        
        // Собираем задачи из каждой колонки
        document.querySelectorAll('.todo-app__tasks-list').forEach(list => {
            const status = list.dataset.statusTarget;
            const tasks = [];
            
            list.querySelectorAll('.todo-app__task').forEach(task => {
                tasks.push(task.textContent.trim());
            });
            
            if (state[status] !== undefined) {
                state[status] = tasks;
            }
        });
        
        // Сохраняем в LocalStorage (перезаписываем полностью)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        console.log('💾 Состояние сохранено');
    }
    
    // 2. Функция загрузки состояния
    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) {
                console.log('📂 Нет сохранённых данных');
                return;
            }
            
            const state = JSON.parse(saved);
            console.log('📂 Загружаем сохранённое состояние');
            
            // Очищаем ВСЕ колонки перед загрузкой
            document.querySelectorAll('.todo-app__tasks-list').forEach(list => {
                list.innerHTML = '';
            });
            
            // Восстанавливаем задачи в колонки
            Object.keys(state).forEach(status => {
                const list = document.querySelector(`[data-status-target="${status}"]`);
                if (list && Array.isArray(state[status])) {
                    // Добавляем сохранённые задачи
                    state[status].forEach(taskText => {
                        if (taskText && taskText.trim() !== '') {
                            const task = document.createElement('li');
                            task.className = 'todo-app__task';
                            task.textContent = taskText;
                            list.appendChild(task);
                        }
                    });
                }
            });
            
        } catch (error) {
            console.error('❌ Ошибка загрузки:', error);
            localStorage.removeItem(STORAGE_KEY); // Очищаем битые данные
        }
    }
    
    // 3. Инициализация Dragula
    const taskLists = document.querySelectorAll('.todo-app__tasks-list');
    const drake = dragula(Array.from(taskLists));
    
    // 4. События Dragula
    drake.on('drag', function(el) {
        el.style.opacity = '0.5';
    });
    
    drake.on('dragend', function(el) {
        el.style.opacity = '1';
    });
    
    drake.on('drop', function(el, target, source, sibling) {
        console.log('✅ Задача перемещена!');
        
        // Визуальный эффект
        el.style.backgroundColor = '#e8f5e8';
        setTimeout(() => {
            el.style.backgroundColor = '';
        }, 500);
        
        // Важно: Dragula уже физически переместил элемент между DOM-узлами
        // Теперь мы просто сохраняем ТЕКУЩЕЕ состояние всех колонок
        
        // Сохраняем полное состояние
        saveState();
    });
    
    // 5. Сохранение перед закрытием страницы
    window.addEventListener('beforeunload', saveState);
    
    // 6. Загружаем сохранённое состояние
    loadState();
    
    console.log('✅ Dragula + LocalStorage готовы к работе!');
});