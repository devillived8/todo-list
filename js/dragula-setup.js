// ========== DRAGULA + LOCALSTORAGE ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Инициализация Dragula и LocalStorage...');
    
    const STORAGE_KEY = 'todo-app-state';
    let isDragging = false;
    let scrollSpeed = 0.5; // Скорость синхронного скролла (экспериментируй)
    
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
            
            document.querySelectorAll('.todo-app__tasks-list').forEach(list => {
                list.innerHTML = '';
            });
            
            Object.keys(state).forEach(status => {
                const list = document.querySelector(`[data-status-target="${status}"]`);
                if (list && Array.isArray(state[status])) {
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
            localStorage.removeItem(STORAGE_KEY);
        }
    }
    
    // 3. Инициализация Dragula с правильными настройками
    const taskLists = document.querySelectorAll('.todo-app__tasks-list');
    const drake = dragula(Array.from(taskLists), {
        moves: function(el, source, handle, sibling) {
            return el.classList.contains('todo-app__task');
        }
    });
    
    // 4. События Dragula
    drake.on('drag', function(el, source) {
        isDragging = true;
        el.style.opacity = '0.5';
        console.log('Начали перетаскивание');
    });
    
    drake.on('dragend', function(el) {
        isDragging = false;
        el.style.opacity = '1';
        console.log('Закончили перетаскивание');
    });
    
    drake.on('drop', function(el, target, source, sibling) {
        console.log('✅ Задача перемещена!');
        
        el.style.backgroundColor = '#e8f5e8';
        setTimeout(() => {
            el.style.backgroundColor = '';
        }, 500);
        
        saveState();
    });
    
    // 5. СИНХРОНИЗИРУЕМ СКРОЛЛ С ПЕРЕТАСКИВАНИЕМ
    // Когда перетаскиваем элемент вниз - страница тоже скроллится вниз
    document.addEventListener('touchmove', function(e) {
        if (isDragging && e.touches.length === 1) {
            const touch = e.touches[0];
            const windowHeight = window.innerHeight;
            
            // Определяем зоны для автоскролла
            const scrollZoneTop = 100;    // Зона вверху экрана (px от верха)
            const scrollZoneBottom = 100; // Зона внизу экрана (px от низа)
            
            // Скроллим ВНИЗ если палец в нижней зоне
            if (touch.clientY > windowHeight - scrollZoneBottom) {
                // Экран опускается ВНИЗ
                window.scrollBy({
                    top: 10 * scrollSpeed,
                    behavior: 'smooth'
                });
            }
            // Скроллим ВВЕРХ если палец в верхней зоне
            else if (touch.clientY < scrollZoneTop) {
                // Экран поднимается ВВЕРХ
                window.scrollBy({
                    top: -10 * scrollSpeed,
                    behavior: 'smooth'
                });
            }
        }
    }, { passive: true }); // passive: true - не блокируем скролл!
    
    // 6. Альтернативный вариант: просто разрешаем естественный скролл
    // Убери все блокировки скролла и используй только это:
    document.querySelectorAll('.todo-app__task').forEach(task => {
        task.addEventListener('touchstart', function() {
            // Временно разрешаем скролл
            this.style.touchAction = 'pan-y';
        });
        
        task.addEventListener('touchend', function() {
            // Возвращаем touch-action: none
            setTimeout(() => {
                this.style.touchAction = 'none';
            }, 500);
        });
    });
    
    // 7. Сохранение перед закрытием страницы
    window.addEventListener('beforeunload', saveState);
    
    // 8. Загружаем сохранённое состояние
    loadState();
    
    console.log('✅ Dragula + LocalStorage готовы к работе!');
});