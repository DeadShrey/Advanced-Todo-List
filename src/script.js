document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');
    const autoDeleteToggle = document.getElementById('auto-delete-toggle');
    const clearBtn = document.getElementById('clear-btn');



    // Auto Delete State
    let isAutoDelete = JSON.parse(localStorage.getItem('isAutoDelete')) || false;
    autoDeleteToggle.checked = isAutoDelete;

    let placeholder;
    let scrollInterval;
    const scrollThreshold = 50;
    const scrollSpeed = 10;

    autoDeleteToggle.addEventListener('change', (e) => {
        isAutoDelete = e.target.checked;
        localStorage.setItem('isAutoDelete', JSON.stringify(isAutoDelete));

        if (isAutoDelete) {
            const completed = document.querySelectorAll('.todo-item.completed');
            if (completed.length > 0) {


                setTimeout(() => {
                    completed.forEach(item => {
                        removeTodoItem(item, true);
                    });
                }, 800);
            }
        }
    });

    // Load from local storage
    const savedTodos = JSON.parse(localStorage.getItem('todos')) || [];
    savedTodos.reverse().forEach(todo => createTodoElement(todo.text, todo.completed));

    function saveTodos() {
        const todos = [];
        document.querySelectorAll('.todo-item').forEach(item => {
            if (item.style.opacity !== '0') {
                todos.push({
                    text: item.querySelector('.todo-text').textContent,
                    completed: item.classList.contains('completed')
                });
            }
        });
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    function removeTodoItem(li, skipTrigger = false) {


        li.style.transform = 'translateX(20px)';
        li.style.opacity = '0';
        setTimeout(() => {
            if (li.parentNode) {
                li.remove();
                saveTodos();
            }
        }, 300);
    }

    function createTodoElement(text, completed = false) {
        const li = document.createElement('li');
        li.draggable = true;
        li.className = `todo-item ${completed ? 'completed' : ''}`;

        li.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            document.body.classList.add('is-dragging');
            li.classList.add('dragging');
            
            
            // Create Placeholder
            placeholder = document.createElement('li');
            placeholder.className = 'drag-placeholder';
            
            const rect = li.getBoundingClientRect();
            placeholder.style.height = `${rect.height}px`;
            placeholder.style.width = `${rect.width}px`;
            
            if (li.parentNode) {
                li.parentNode.insertBefore(placeholder, li.nextSibling);
            }

            setTimeout(() => {
                li.style.display = 'none';
            }, 0);
        });

        li.addEventListener('dragend', () => {
            document.body.classList.remove('is-dragging');
            li.classList.remove('dragging');
            li.style.display = 'flex';
            
            if (placeholder && placeholder.parentNode) {
                placeholder.parentNode.insertBefore(li, placeholder);
                placeholder.remove();
            }
            placeholder = null;

            if (typeof clearAutoScroll === 'function') clearAutoScroll();
            saveTodos();
        });

        li.innerHTML = `
            <button class="check-btn" aria-label="Toggle completion">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
            <span class="todo-text">${text}</span>
            <button class="delete-btn" aria-label="Delete task">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
        `;

        const todoTextSpan = li.querySelector('.todo-text');

        todoTextSpan.addEventListener('click', () => {
            if (li.classList.contains('completed')) return; // Prevent editing valid completed tasks if desired, or allow it. Usually better to allow editing text even if completed, but user might want to uncheck first. Let's allow it for now.

            const currentText = todoTextSpan.textContent;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentText;
            input.className = 'edit-input'; // We might need to add some styles for this class

            // Replace span with input
            li.replaceChild(input, todoTextSpan);
            input.focus();

            const saveEdit = () => {
                if (input.parentNode !== li) return; // Prevent multiple saves

                const newText = input.value.trim();
                if (newText) {
                    todoTextSpan.textContent = newText;
                    li.replaceChild(todoTextSpan, input);
                    saveTodos();
                } else {
                    // If empty, revert to original text
                    li.replaceChild(todoTextSpan, input);
                }
            };

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveEdit();
                }
            });
        });

        const checkBtn = li.querySelector('.check-btn');
        checkBtn.addEventListener('click', () => {
            li.classList.toggle('completed');
            saveTodos();

            if (li.classList.contains('completed')) {

            }

            if (li.classList.contains('completed') && isAutoDelete) {
                setTimeout(() => {
                    if (li.parentElement && li.classList.contains('completed')) {
                        // FIX: Pass true to skipTrigger to avoid Red glow
                        removeTodoItem(li, true);
                    }
                }, 800);
            }
        });


        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            removeTodoItem(li);
        });

        todoList.prepend(li);
        saveTodos();
    }





    todoList.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        // Auto-scroll logic
        const rect = todoList.getBoundingClientRect();
        const offset = e.clientY - rect.top;
        const bottomOffset = rect.bottom - e.clientY;

        if (scrollInterval) clearInterval(scrollInterval);
        
        if (offset < scrollThreshold) {
             scrollInterval = setInterval(() => { todoList.scrollTop -= scrollSpeed; }, 20);
        } else if (bottomOffset < scrollThreshold) {
             scrollInterval = setInterval(() => { todoList.scrollTop += scrollSpeed; }, 20);
        }

        const afterElement = getDragAfterElement(todoList, e.clientY);
        
        if (!placeholder) {
             // Fallback if placeholder missing
             return; 
        }

        if (afterElement == null) {
            if (todoList.lastElementChild !== placeholder) {
               animateMove(() => todoList.appendChild(placeholder));
            }
        } else {
             if (placeholder.nextElementSibling !== afterElement) {
                animateMove(() => todoList.insertBefore(placeholder, afterElement));
             }
        }

        function animateMove(moveAction) {
            const items = [...todoList.querySelectorAll('.todo-item:not(.dragging)')];
            const positions = new Map();

            // First: Get old positions
            items.forEach(item => positions.set(item, item.getBoundingClientRect().top));

            // Action: Update DOM
            moveAction();

            // Last: Get new positions and Invert
            items.forEach(item => {
                const oldTop = positions.get(item);
                const newTop = item.getBoundingClientRect().top;
                const delta = oldTop - newTop;

                if (delta !== 0) {
                    item.style.transition = 'none';
                    item.style.transform = `translateY(${delta}px)`;
                    
                    // Force reflow
                    void item.offsetHeight; 
                    
                    // Play: Animate to new position
                    requestAnimationFrame(() => {
                        item.style.transition = 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)'; // Matches CSS transition roughly but explicit for transform
                        item.style.transform = '';
                    });
                }
            });
        }
    });



    // Clean up scroll on drag end
    function clearAutoScroll() {
        if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }
    }



    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.todo-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function addTodo() {
        const text = todoInput.value.trim();
        if (text) {
            createTodoElement(text);

            todoInput.value = '';
            todoInput.focus();
        }
    }

    addBtn.addEventListener('click', addTodo);

    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    clearBtn.addEventListener('click', () => {
        const items = document.querySelectorAll('.todo-item');
        Array.from(items).reverse().forEach((item, index) => {
            setTimeout(() => {
                removeTodoItem(item, true); // true avoids checking for auto-delete logic if applicable, but mainly we just want to remove
            }, index * 50); // Stagger deletion by 50ms each
        });
    });


});
