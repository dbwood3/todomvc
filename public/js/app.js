/*global jQuery, Handlebars, Router */
jQuery(function ($) {
  
  'use strict';

  //Handlebar helper: determines whether to check the option given (all,complete,active)
  Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	
  var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;
  

	var util = {
		
    //creates uuid
    uuid: function () {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}

			return uuid;
		},
		
    //simple function to create plurals... just add an 's'
    pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
		},
		
    //either stores or gets localstorage 
    store: function (namespace, data) {
			if (arguments.length > 1) {
				return localStorage.setItem(namespace, JSON.stringify(data));
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
  };

	var App = {
    
    //initializes the app, 
		init: function () {
			this.todos = util.store('todos-jquery');  //gets todo array from the utility store
			this.todoTemplate = Handlebars.compile(document.querySelector('#todo-template').innerHTML); //sets up todo templete in Handlebars 
			this.footerTemplate = Handlebars.compile(document.querySelector('#footer-template').innerHTML);  //sets up footer templet in Handlbars
			this.bindEvents(); //creates eventlisteners

		
      // handles 'all', 'completed', and 'active' for director
      new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render(); //renders the page
				}.bind(this)
			}).init('/all'); //set all as default
		},
		
    bindEvents: function () {
      document.getElementById('new-todo').addEventListener('keyup', function(event) {
        App.create(event);
      });      
      
      document.getElementById('toggle-all').addEventListener('change', function(event) {
        App.toggleAll(event);
      });  
      
      document.getElementById('footer').addEventListener('click', function(event) {
        // console.log(event);        
        if(event.target.id === 'clear-completed') {
           App.destroyCompleted(event);
        }                                                     
      });        
      
      document.getElementById('todo-list').addEventListener('click', function(event) {
        if(event.target.className === 'toggle') {
          App.toggle(event);
        } else if (event.target.className === 'destroy') {
          App.destroy(event);
        }
      });
      
      document.getElementById('todo-list').addEventListener('dblclick', function(event) {
        // console.log(event);
        if(event.target.localName === 'label') {
          App.edit(event);
        }
      }); 
      
      document.getElementById('todo-list').addEventListener('keyup', function(event) {
        // console.log(event);
        if(event.target.className === 'edit') {
          App.editKeyup(event);
        }
      }); 
      
      document.getElementById('todo-list').addEventListener('focusout', function(event) {
        // console.log(event);
        if(event.target.className === 'edit') {
          App.update(event);
        }
      }); 
    },

    // renders todo entry area and list
		// render: function () {
		// var todos = this.getFilteredTodos();  //sets up local todos array with current selection
		// 	$('#todo-list').html(this.todoTemplate(todos));  //creates todo list in Handlebar 
		// 	$('#main').toggle(todos.length > 0);  //hides todo list and footer (main) if there are no todos
		// 	$('#toggle-all').prop('checked', this.getActiveTodos().length === 0);  // makes tick for toggle all visiable if there are todos
		// 	this.renderFooter();  //renders the footer
		// 	$('#new-todo').focus(); 
		// 	util.store('todos-jquery', this.todos);  //stores the whole todo array (this.todos NOT local todos)
		// },
    

    render: function () {
      var todos = this.getFilteredTodos();  //sets up local todos array with current selection
			document.getElementById('todo-list').innerHTML = (this.todoTemplate(todos));  //creates todo list in Handlebar 
      document.getElementById('main').style.display = (todos.length ? "block" : "none");  //hides todo list and footer (main) if there are no todos
			document.getElementById('toggle-all').setAttribute('checked', this.getActiveTodos().length === 0);  // makes tick for toggle all visiable if there are todos
			this.renderFooter();  //renders the footer
      document.getElementById('new-todo').focus();
      // console.log(todos, this.todos);
			util.store('todos-jquery', this.todos);  //stores the whole todo array (this.todos NOT local todos)
      
		},

    
		
    //renders footer area
    renderFooter: function () {
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});

			document.getElementById('footer').innerHTML = template;
      document.getElementById('footer').style.display = (todoCount > 0 ? 'block' : 'none');  //shows/hides todo list
      
		},
    
    
		//gets property from toggle all as whether to check (set up in render() and then does it to each todo 
    toggleAll: function (e) {
			console.log(e.target);
      // var isChecked = $(e.target).prop('checked');
      var isChecked = e.target.checked

			this.todos.forEach(function (todo) {
				todo.completed = isChecked;
			});

			this.render();
		},
		
    //returns filtered list of active todos
    getActiveTodos: function () {
			return this.todos.filter(function (todo) {
				return !todo.completed;
			});
		},
    
    //returns filtered list of completed todos
		getCompletedTodos: function () {
			return this.todos.filter(function (todo) {
				return todo.completed;
			});
		},
		
    //entry point to get the proper todo list
    //returns the currently requested list
    getFilteredTodos: function () {
			//checks to see if filter is active todos, 
      //then goes and gets the active todos
      if (this.filter === 'active') {
				return this.getActiveTodos();
			}
      //chesk to see if the filter is completed todos,
      //then goes and gets the completed todos
			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}
      //otherwise it just returns the todos
			return this.todos;
		},
		
    //overwrites todos with activeTodos
    //changes filter setting to all
    destroyCompleted: function () {
			this.todos = this.getActiveTodos();
			this.filter = 'all';
			this.render();
		},
       
		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array
		indexFromEl: function (el) {
			var id = el.closest('li').getAttribute('data-id');
			// console.log($(el), el);
      
      var todos = this.todos;
			var i = todos.length;

			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		},
    
    //creates new todos
    //called by keyup eventlistener
		create: function (e) {
			var input = e.target;
			var val = input.val().trim();

			//checks to see if enter key was pushed or there was no value (lo
      if (e.which !== ENTER_KEY || !val) {
				return;
			} 

      //creates new todos array item
			this.todos.push({
				id: util.uuid(),
				title: val,
				completed: false
			});

			//clears the input todo area
      input.val('');  

			this.render();
		},
		
    //toggles an individual todos completed property
    toggle: function (e) {
			var i = this.indexFromEl(e.target);
			this.todos[i].completed = !this.todos[i].completed;
			this.render();
		},
		
    //called on double click of todo item
    //gives focus to the text field
    // POTENTIAL IMPROVEMENT: you shouldn't be able to edit completed tasks.
    edit: function (e) {

      var el = (e.target).closest('li');
      el.setAttribute('class','editing');
      var input = el.querySelector('input.edit');
			input.focus();
      input.focus();
      // input.val(input.val()).focus();  
		},

    //if Keyup is Enter or Escape, this method handles it.
    //Enter loses focus via .blur()
    //Escape sets data to abort event and truel then loses focus
    //either case triggers an update()
    editKeyup: function (e) {
			if (e.which === ENTER_KEY) {
				e.target.blur();
			}

			if (e.which === ESCAPE_KEY) {
				e.target.setAttribute('abort', true);
        e.target.blur();
			}
		},
		
    //update called either directly from item losign focus either through this.editKeyup or user clicking away
    update: function (e) {
			var el = e.target;
			var val = el.value.trim();

			//if there is nothing left "" when focus is changed, deletes todos item
      if (!val) {
				this.destroy(e);
				return;
			}
  
      //if abort is set, then data is not saved and abort is reset
      // else set the value of the new todo in the title.
			if (el.getAttribute('abort')) {
				el.setAttribute('abort', false);
			} else {
				this.todos[this.indexFromEl(el)].title = val;   
			}

			this.render();
		},
    
    //gets the current todo and kills it.  dead.
		destroy: function (e) {
			this.todos.splice(this.indexFromEl(e.target), 1);
			this.render();
		}
	};

	App.init();

});