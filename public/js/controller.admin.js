// AGENTES DE INNOVACIÓN - TÚ EVALÚAS APP CREATOR
// @package  : agentes
// @location : /js
// @file     : controller.admin.js
// @author  : Gobierno fácil <howdy@gobiernofacil.com>
// @url     : http://gobiernofacil.com

define(function(require){
  
  //
  // L O A D   T H E   A S S E T S   A N D   L I B R A R I E S
  // --------------------------------------------------------------------------------
  //
  var Backbone    = require('backbone'),
      Velocity    = require('velocity'),
      d3          = require('d3'),
      sweetalert  = require('sweetalert'),
      validation  = require("jquery-validation"),
      //aditional   = require("additional-methods"),
      Question    = require('views/question_view.admin'),
      Description = require('views/description_view.admin'),
      Option      = require('text!templates/option_item.admin.html'),
      Section_nav = require('text!templates/section_selector.admin.html'),
      Categories  = require('categories'),
      Branches    = require('ramos'),
      Programs    = require('programas');


  //
  // I N I T I A L I Z E   T H E   B A C K B O N E   " C O N T R O L L E R "
  // --------------------------------------------------------------------------------
  //
  var controller = Backbone.View.extend({
    
    // 
    // [   DEFINE THE EVENTS   ]
    // 
    //
    events :{
      // [ DISPLAY THE BANNER ]
      'change #survey-banner' : 'display_banner',
      
      // [ SURVEY NAVIGATION ]
      'click #survey-navigation-menu a' : 'render_section',
  
      // [ ADD QUESTION ]
      'change #survey-add-question input[name="type"]' : '_set_is_type',
      'click #survey-add-buttons a.add-question'       : 'render_question_form',
      'click #survey-add-question-btn'                 : '_save_question',
      // [ ADD OPTION ]
      'click #survey-add-options li a'  : '_remove_option',
      'focus #survey-add-options input' : '_enable_save_option',
      'blur #survey-add-options input'  : '_disable_save_option',
      // [ ADD HTML ] 
      'click #survey-add-buttons a.add-text' : 'render_content_form',
      'click #survey-add-content-btn'        : '_save_content',
      // [ ADD RULE ]
      'change #survey-navigation-rules-container .select-question' : '_render_rules_panel_answers',
      'click #survey-navigation-rules-container .add-rule-btn'     : '_save_rule',
      'click #survey-navigation-rules-container .remove-rule-btn'  : '_remove_rule',

      // [ UPDATE CATEGORY ]
      "change #survey-category" : 'update_category',

      // [ UPDATE BRANCH ]
      "change #survey-branch"  : 'update_branch',
      "change #survey-program" : 'update_program', 

      // [ LIMIT TAGS AND SUBCATEGORIES ]
      "change input[name='survey-subs[]']" : "limit_subs",
      "change input[name='survey-tags[]']" : "limit_tags",

      // [ END SURVEY ]
      "click #finish-survey-btn" : "finish_survey_alert",

      // [ FAST SAVE ]
      "submit form[name='survey-app']" : "_save_question" //_save_question
      
    },

    // 
    // [ SET THE CONTAINER ]
    //
    //
    el : 'body',

    // 
    // [ THE TEMPLATES ]
    //
    //
    sec_nav_template : _.template(Section_nav),
    answer_template  : _.template(Option),

    //
    // [ THE INITIALIZE FUNCTION ]
    //
    //
    initialize : function(){
      $("#ubp").validate({
        rules : {
          "survey-title"    : "required",
          "survey-category" : "required",
          "survey-subs[]"   : "required",
          "survey-tags[]"   : "required",
          "survey-ptp" : {
            "url" : true
          }
        },
        messages : {
          "survey-title"    : "Debes escribir un título",
          "survey-category" : "Debes seleccionar una categoría",
          "survey-subs[]"   : "Debes seleccionar por lo menos una subcategoría",
          "survey-tags[]"   : "Debes seleccionar por lo menos una etiqueta",
          "survey-ptp"    : {
            'url' : "El campo debe ser un url"
          }
        },
        errorPlacement: function (error, element) {
          var name = element.attr("name");
          if(name == "survey-title"){
            $("#js-error-title").append(error);
          }
          if(name == "survey-ptp"){
            $("#js-error-ptp").append(error);
          }
          else if(name == "survey-category"){
            $("#js-error-category").append(error);
          }
          else if(name == "survey-subs[]"){
            $("#js-error-subcategory").append(error);
          }
          else{
            $("#js-error-tags").append(error);
          }

        }
      });
      /**/
      this.blueprint       = SurveySettings.blueprint;
      this.collection      = new Backbone.Collection(this.blueprint.questions);
      this.collection.url  = BASE_PATH + "/dashboard/preguntas";//'/index.php/surveys/question';
      this.rules           = new Backbone.Collection(this.blueprint.rules);
      this.rules.url      = BASE_PATH + "/dashboard/reglas";//'/index.php/surveys/rule';
      this.current_section = 0; // show all questions
      this.collection.comparator = function(m){ return m.get("section_id")};
      this.collection.sort();

      // THE RULES
      this.listenTo(this.collection, "sync", this.update_ui);

      // [ FIX THE SCOPES ]
      this._render_new_option = $.proxy(this._render_new_option, this);

      // [ DISPLAY THE FULL QUESTION LIST ]
      this.render_section(this.current_section);

      // [ ENABLE THE CATEGORY SELECTOR ]
      this.render_category();

      // [ ENABLE THE BRANCH SELECTOR ]
      this.render_branch();
    },

    //
    // R E N D E R   F U N C T I O N S 
    // --------------------------------------------------------------------------------
    //
    update_ui : function(model, response){
      if(response.remove_rule){
        var r = this.rules.where({question_id : model.id});
        console.log(r);
        this.rules.remove(r);
      }
    },

    // [ RENDER BRANCHES ]
    //
    //
    render_branch : function(){
      this.branches = new Backbone.Collection(Branches.list);
      this.programs = new Backbone.Collection(Programs.list);

      var branch  = this.branches.findWhere({nombre : this.blueprint.branch}),
          // unit    = branch && this.blueprint.unit ? this.blueprint.unit : "",
          program = branch && this.blueprint.program ? this.blueprint.program : "";

      // RENDER BRANCH
      this.branches.each(function(branch){
        var name = branch.get("nombre");

        if(name == this.blueprint.branch){
          this.$("#survey-branch").append("<option selected>" + name + "</option>");
        }
        else{
          this.$("#survey-branch").append("<option>" + name + "</option>");
        }

      }, this);

      // RENDER UNITS
      /*
      if(branch){

        branch.get('unidades').forEach(function(unit){
          var name = unit;
          if(name == this.blueprint.unit){
            this.$("#survey-unit").append("<option selected>" + name + "</option>");
          }
          else{
            this.$("#survey-unit").append("<option>" + name + "</option>");
          }
        }, this);
      }
      */

      // RENDER PROGRAMS
      if(branch){
        var programas = this.programs.where({ramo : branch.id});
        programas.forEach(function(p){
          var name = p.get('programa');
          if(name == this.blueprint.program){
            this.$("#survey-program").append("<option selected>" + name + "</option>");
          }
          else{
            this.$("#survey-program").append("<option>" + name + "</option>");
          }
        }, this);
      }
    },

    update_branch : function(e){
      var branch = this.$("#survey-branch").val();
      //this.$("#survey-unit").html("");
      this.$("#survey-program").html("");
      this.$("#survey-ptp").val("");
      if(!branch) return;

      branch = this.branches.findWhere({nombre : branch});

      // RENDER UNITS
      /*
      branch.get('unidades').forEach(function(unit){
          this.$("#survey-unit").append("<option>" + unit + "</option>");  
      }, this);
      */

        
      // RENDER  PROGRAMS
      var programas = this.programs.where({ramo : branch.id});
      programas.forEach(function(p){
        var n = p.get('programa');
        this.$("#survey-program").append("<option>" + n + "</option>");  
        this.$("#survey-ptp").val(p.get('ptp'));
      }, this);
      

      // RENDER PTP
    },

    update_program : function(e){
      var branch = this.$("#survey-branch").val();
      if(!branch) return;

      branch = this.branches.findWhere({nombre : branch});

      var program = this.$("#survey-program").val();
      program = this.programs.findWhere({ramo : branch.id, programa : program});

      if(program){
        this.$("#survey-ptp").val(program.get('ptp'));
      }
    },


    // [ RENDER CATEGORIES ]
    //
    //
    render_category : function(){
      this.categories = new Backbone.Collection(Categories.list);

      var category    = this.categories.findWhere({name : this.blueprint.category}),
          subcat      = category && this.blueprint.subcategory ? this.blueprint.subcategory.split(",") : [];
          tags        = category && this.blueprint.tags ? this.blueprint.tags.split(",") : [];

      this.categories.each(function(cat){
        var name = cat.get("name");
        // RENDER CATEGORY
        if(name == this.blueprint.category){
          this.$("#survey-category").append("<option selected>" + name + "</option>");
        }
        else{
          this.$("#survey-category").append("<option>" + name + "</option>");
        }
      }, this);

      // RENDER SUBCATEGORY
      if(category){
        category.attributes.sub.forEach(function(sub){
          if(subcat.indexOf(sub) != -1){
            this.$("#sub-list").append("<li><label><input type='checkbox' value='" + sub + "' name='survey-subs[]' checked> " + sub + "</label></li>");
          }
          else{
            this.$("#sub-list").append("<li><label><input type='checkbox' value='" + sub + "' name='survey-subs[]'> " + sub + "</label></li>");
          }
          
        }, this);
      }

      // RENDER  TAGS
      if(category){
        category.attributes.tags.forEach(function(tag){
          if(tags.indexOf(tag) != -1){
            this.$("#tag-list").append("<li><label><input type='checkbox' value='" + tag + "' name='survey-tags[]' checked> " + tag + "</label></li>");
          }
          else{
            this.$("#tag-list").append("<li><label><input type='checkbox' value='" + tag + "' name='survey-tags[]'> " + tag + "</label></li>");
          }
          
        }, this);
      }
    },

    update_category : function(e){
      var category = this.$("#survey-category").val();
      this.$("#sub-list").html("");
      this.$("#tag-list").html("");
      if(!category) return;

      category = this.categories.findWhere({name : category});

      // RENDER SUBCATEGORY
        category.attributes.sub.forEach(function(sub){
          this.$("#sub-list").append("<li><label><input type='checkbox' value='" + sub + "' name='survey-subs[]'> " + sub + "</label></li>");  
        }, this);

      // RENDER  TAGS
      category.attributes.tags.forEach(function(tag){
        this.$("#tag-list").append("<li><label><input type='checkbox' value='" + tag + "' name='survey-tags[]'> " + tag + "</label></li>");
      }, this);
    },

    // [ RENDER QUESTIONS FROM A SECTION ]
    //
    //
    render_section : function(e){
      if(typeof e !== "number") e.preventDefault();
      // [1] genera las variables de inicio
      var section   = typeof e === "number" ? e : +e.currentTarget.getAttribute('data-section'),
          questions = !section ? this.collection.models : this.collection.where({section_id : section});
      // [2] actualiza la sección en el modelo de la app
      this.current_section = section;
      // [3] crea la lista de preguntas
      //this.sub_collection.set(questions);
      this.$("#survey-question-list").html("");
      questions.forEach(function(q){
        this._render_question(q);
      }, this);
      // [4] genera el navegador de secciones. Esta función ejectua lo siguiente:
      //     - this._render_rules_panel();
      this.render_section_menu();
    },

    // [ RENDER SECTION MENU ]
    //
    //
    render_section_menu : function(){
      // 
      // [1] genera las variables de inicio
      var menu     = document.getElementById('survey-navigation-menu'),
          nav      = document.getElementById('survey-app-navigation'),
          sections = _.uniq(this.collection.pluck('section_id')),
          section  = this.current_section,
          content  = '';
      // [2] si hay menos de dos secciones, el menú para navegar
      //     entre secciones desaparece
      if(sections.length < 2){
        nav.style.display = "none";
        return;
      }
      // [3] Si hay más de una sección, el menú se hace visible, 
      //     y se le agrega un cero al inicio de la lista de secciones
      //     para que represente la opción de mostrar todas las preguntas.
      //     El contenido del <ul> se vacía para generar de nuevo cada sección.
      nav.style.display = "";
      sections.unshift(0);
      menu.innerHTML = "";

      // [4] Se genera el contenido del <ul> que contiene los links para 
      //     ver las preguntas de cada sección, y se inserta al DOM
      content += "<li>Ver secciones:</li>";
      for(var  i = 0; i < sections.length; i++){
        content += "<li><a href='#' data-section='" 
                + sections[i] +"'>" 
                + (sections[i] ? sections[i] : 'todas') + "</a></li>"
      }
      menu.innerHTML = content;

      // [5] limpia la lista de la clase "current", para después asignarla a
      //     la sección actual en el anchor
      this.$('#survey-navigation-menu a').removeClass('current');
      this.$('#survey-navigation-menu a[data-section="' + section + '"]').addClass('current');

      // [6] genera el menú para crear/ver las reglas de navegación
      this._render_rules_panel();
    },

    // [ RENDER RULES PANEL ]
    //
    //
    _render_rules_panel : function(){
      // [0] obtiene la referencia de los elementos a ocupar
      var menu     = document.getElementById('survey-navigation-rules-container'),
          list     = document.getElementById('survey-navigation-rules'),
          q_select = menu.querySelector('.select-question'),
      // [1] crea las variables de inicio
          section          = this.current_section,
          rules            = this.rules.where({section_id : section}),
          sections         = _.uniq(this.collection.pluck('section_id')),
          low_sections     = null,
          low_questions    = [],
          questions        = null,
          q_select_content = "";
      // [2] vacía la lista de reglas
      list.innerHTML = "";
      // [3] agrega la lista de reglas existentes
      _.each(rules, function(rule){
        this._render_rule(rule);
      }, this);
      
      // [4] obtiene las secciones anteriores a la actual para 
      //     buscar en ellas preguntas de opción múltiple de las
      //     cuales pueda depender si se ve o no.
      low_sections = _.filter(sections, function(sec){
        return Number(sec) < Number(section);
      }, this);
      // [5] busca preguntas de opción múltiple de secciones
      //     anteriores para el <select> de crear nueva regla.
      _.each(low_sections, function(section_id){
        /*
        questions = this.collection.where({
          is_description : 0, 
          section_id     : section_id, 
          type           : "integer"
        });
        */

        questions = this.collection.filter(function(m){
          var n = m.attributes;
          return ! n.is_description && n.section_id == section_id && n.type == "multiple" && n.options.length;
        }, this);

        Array.prototype.push.apply(low_questions, questions);
      }, this);
      // [6] si hay preguntas de opción múltiple anteriores,
      //     llena el <select> de preguntas
      if(low_questions.length){
        this.$('.rule-answer').remove();
        _.each(low_questions, function(q){
          q_select_content += "<option class='rule-answer' value='" + q.id +"'>" + q.get('question') + "</option>";
        },this);

        this.$(q_select).append(q_select_content);
        menu.style.display = "";
      }
      // [7] si no hay preguntas de opción múltiple anteriores,
      //     se oculta el menú de reglas
      else{
        menu.style.display = "none";
      }
      /**/
    },

    // [ ADD NEW RULE TO THE LIST ]
    //
    //
    _render_rule : function(model){
      // [1] método larguísmo para agregar un <li>!!!!!!
      var ul       = document.getElementById('survey-navigation-rules'),
          li       = document.createElement('li'),
          anchor   = document.createElement('a'),
          q_id     = model.get('question_id'),
          question = this.collection.get(q_id),
          q_text   = question.get('question'),
          options  = question.get('options');

          var option   = _.find(options, function(m){
            return (m.description || m.get('description')) == model.get('value');
          }, this),
          o_text   = option.description || option.get('description'),
          text     = document.createTextNode(q_text + ' | R= ' + o_text);

          anchor.innerHTML = "x";
          anchor.setAttribute('class', 'remove-rule-btn');
          anchor.setAttribute('href', '#');
          anchor.setAttribute('data-rule', model.id);

          li.appendChild(text);
          li.appendChild(anchor);
          ul.appendChild(li);
    },

    // [ RENDER THE ANSWERS <SELECT> FOR THE RULES ]
    //
    //
    _render_rules_panel_answers : function(e){
      var question_id  = e.target.value,
          question     = this.collection.get(question_id),
          answers      = document.querySelector('#survey-add-navigation-rule .select-answer'),
          answers_list = '';
      if(question){
        if(question.attributes.options.length){
          _.each(question.attributes.options, function(option){
            answers_list += "<option class='rule-answer-option'>" + (option.description || option.get('description')) + "</option>";
            /*
            answers_list += "<option class='rule-answer-option' value='" 
                         + (option.value || option.get('value')) +"'>" 
                         + (option.description || option.get('description')) + "</option>";
            */
          }, this);
          answers.innerHTML = answers_list;
          answers.style.display = "";
        }
      }
      else{
        answers.style.display = "none";
      }
    },

    // [ RENDER SINGLE QUESTION ]
    //
    //
    _render_question : function(model){
      var container      = this.$('#survey-question-list'),
          is_description = Number(model.get('is_description')),
          item           = ! is_description ? new Question({model : model}) : new Description({model : model});

      container.append(item.render().el);
      // this.render_section_menu();
    },

    // [ SHOW THE ADD QUESTION FORM ]
    //
    //
    render_question_form : function(e){
      e.preventDefault();
      var q_form   = document.querySelector('#survey-add-question .survey-section-selector-container'),
          c_form   = document.querySelector('#survey-add-content .survey-section-selector-container'),
          selector = c_form.querySelector('.survey-section-selector');
      if(selector){
        q_form.appendChild(c_form.removeChild(selector));
      }

      document.querySelectorAll('#survey-add-question input[value="text"]')[0].checked = true;
      this.$('#survey-add-content').hide();
      this.$('#survey-add-question').show();

      if(this.collection.length){
        this.render_section_selector();
      }
    },

    // [ SHOW THE ADD HTML FORM ]
    //
    //
    render_content_form : function(e){
      e.preventDefault();
      var q_form   = document.querySelector('#survey-add-question .survey-section-selector-container'),
          c_form   = document.querySelector('#survey-add-content .survey-section-selector-container'),
          selector = q_form.querySelector('.survey-section-selector');
      
      if(selector){
        c_form.appendChild(q_form.removeChild(selector));
      }

      this.$('#survey-add-content').show();
      this.$('#survey-add-options').hide();
      this.$('#survey-add-question').hide();

      if(this.collection.length){
        this.render_section_selector();
      }
    },

    // [ SHOW THE SECTION SELECTOR ]
    //
    //
    render_section_selector : function(){
      var sections = _.uniq(this.collection.pluck('section_id')),
          data     = [],
          box      = this.el.querySelector('.survey-section-selector'),
          el       = box.querySelector('select'),
          content  = '',
          i;
          box.style.display = '';
      if(!sections){
        data.push({text : 'sección 1', value : 1});
      }
      else{
        if(sections.length >= 2){
          sections = sections.sort(function(a,b){
            return a-b;
          });
        }
        for(i = 1; i<= sections.length; i++){
          data.push({text : 'sección ' + sections[i-1], value : sections[i-1]});
        }
      }
      data.push({text : 'nueva sección', value : Number(sections[sections.length-1]) + 1});

      for(i = 0; i < data.length; i++){
        content +="<option value='" + data[i].value + "'>" + data[i].text + "</option>";
      }
      el.innerHTML = content;
      el.children[el.children.length - 2].selected = true;
    },

    // [ ADD NEW ANSWER OPTION ]
    //
    //
    _render_new_option : function(e){
      if(e.keyCode === 13 && e.target.value){
        var name = _.uniqueId('lp');
        this.$('#survey-add-options ul').append(this.answer_template({
          name     : name, 
          value    : '',
          is_first : false
        }));
        document.querySelector('#survey-add-options input[name="' + name + '"]').focus();
      }
    },

    // [ RESTORE DEFAULT LOOKS TO THE ADD QUESTION FORM ]
    //
    //
    clear_question_form : function(){
      var form    = document.getElementById('survey-add-question'),
          options = document.getElementById('survey-add-options'),
          keep_op = document.getElementById('keep-options'),
          ul      = options.querySelector('ul');
      
      if(! keep_op.checked){
         while(ul.children.length > 1){
          ul.removeChild(ul.children[1]);
        }
      }
      
      if(ul.children.length){
        ul.children[0].querySelector('input').value = "";
      }
      form.querySelector('input[name="question"]').value = "";
    },

    // [ SHOW THE LOADING STATUS: TITLE ]
    //
    //
    _render_saving_title : function(e){

    },

    // [ SHOW THE SUCCESS STATUS: TITLE ]
    //
    //
    _render_saved_title : function(model, response, options){
    },

    //
    // I N T E R A C T I O N
    // --------------------------------------------------------------------------------
    //

    // [ ADD A LISTENER TO THE ENTER BTN ]
    //
    //
    _enable_save : function(e){
      window.onkeyup = this._update_title;
    },

    // [ REMOVE THE LISTENER TO THE ENTER BTN ]
    //
    //
    _disable_save : function(e){
      window.onkeyup = false;
      this._update_title();
    },

    _enable_save_option : function(e){
      window.onkeyup = this._render_new_option;
    },

    _disable_save_option : function(e){
      window.onkeyup = false;
    },

    _remove_option : function(e){
      e.preventDefault();
      this.$(e.currentTarget).parent().remove();
    },

    _set_is_type : function(e){
      var container = document.querySelector("#survey-add-options ul");
      if(e.currentTarget.value == 'multiple' || e.currentTarget.value == 'multiple-multiple'){
        if(! container.getElementsByTagName('li').length){
          this.$(container).append(this.answer_template({
            name     : _.uniqueId('lp'), 
            value    : '',
            is_first : 1
          }));
        }
        this.$('#survey-add-options').show();
        this.$("#personal-warning").hide();
      }
      else if(e.currentTarget.value== "personal"){
        this.$("#personal-warning").show();
        this.$('#survey-add-options').hide();
      }
      else{
        this.$('#survey-add-options').hide();
        this.$("#personal-warning").hide();
      }
    },




    //
    // I N T E R N A L   F U N C T I O N S 
    // --------------------------------------------------------------------------------
    //

    // [ UPDATE TITLE ] 
    //
    //
    _update_title : function(e){
      if(e === void 0 || e.keyCode === 13){
        this._update_bluprint();
      }
    },

    // [ UPDATE BLUEPRINT ]
    //
    //
    _update_bluprint : function(e){
      var container = document.getElementById('survey-app-title'),
          is_closed = container.querySelector('input[name="is_closed"]').checked,
          is_public = container.querySelector('input[name="is_public"]').checked,
          title     = container.querySelector('input[type="text"]').value;
      
      if(title) this.model.set({title : title});
      this.model.set({
        is_public : is_public,
        is_closed : is_closed,
      });

      this.model.save();
    },

    // [ CREATE THE CSV ]
    // 
    //
    _save_csv : function(e){

    },

    // [ SAVE QUESTION ] 
    //
    //
    _save_question : function(e){
      e.preventDefault();
      var form        = document.getElementById("survey-add-question"),//this.html.question_form[0],
          type        = form.querySelector('input[name="type"]:checked').value,
          title_input = form.querySelector('input[name="question"]'),
          title       = title_input.value,
          section     = this.el.querySelector('.survey-section-selector select').value,
          question    = new Backbone.Model(null, {collection : this.collection}),
          that        = this;
      if(! title){
        this.$(title_input).addClass('error');
        return;
      }
      else{
        this.$(title_input).removeClass('error');
      }
      question.set({
        section_id     : section,
        blueprint_id   : this.blueprint.id,
        question       : title, 
        is_description : 0,
        // is_location    : type === 'location',
        // aquí puede cambiar la lógica para tener más tipos de respuesta
        type           : type,
        options        : type == 'multiple' || type == 'multiple-multiple' ? this._get_options() : [],
        _token         : document.querySelector("input[name='_token']").value
      });

      question.save(null, {
        success : function(model, response, options){
          that.collection.add(model); 
          that.render_section_selector();
          that.clear_question_form();
          that.render_section(Number(model.get('section_id')));
        }
      });
    },

    __save_question : function(e){
      e.preventDefault();
      console.log("yahoo!!!");
    },

    // [ REMOVE QUESTION ]
    //
    //
    _remove_question : function(){
      this.render_section_selector();
    },

    // [ SAVE CONTENT ] 
    //
    //
    _save_content : function(e){
      e.preventDefault();
      var html    = this.$('#survey-add-content textarea').val(),
          section = this.$('.survey-section-selector select').val(),
          content = new Backbone.Model(null, {collection : this.collection}),
          that    = this;

      if(! html){
        this.$('#survey-add-content textarea').addClass('error');
        return;
      }

      content.set({
        section_id     : section,
        blueprint_id   : this.blueprint.id,
        question       : html, 
        is_description : 1,
        is_location    : 0,
        type           : 'text',
        options        : [],
        _token         : document.querySelector("input[name='_token']").value
      });

      content.save(null, {
        success : function(model, response, options){
          that.collection.add(model);
          that.render_section_selector();
          that.$('#survey-add-content textarea').val("");
          that.render_section( Number(model.get('section_id'))  );
        }
      });
    },

    // [ SAVE RULE ]
    //
    //
    _save_rule : function(e){
      e.preventDefault();
      var container   = document.querySelector('#survey-add-navigation-rule'),
          question_id = container.querySelector('.select-question').value,
          value       = container.querySelector('.select-answer').value,
          section_id  = this.current_section,//this.model.get('current_section'),
          rule        = new Backbone.Model(null, {collection : this.rules}),
          that        = this;

      if(!Number(question_id)) return;
      
      rule.set({
        blueprint_id : this.blueprint.id,
        section_id   : section_id,
        question_id  : question_id,
        value        : value,
        _token       : document.querySelector("input[name='_token']").value
      });

      rule.save(null, {
        success : function(model, response, options){
          that.rules.add(model);
          that._render_rules_panel();
        }
      });
    },

    // [ REMOVE RULE ]
    //
    //
    _remove_rule : function(e){
      e.preventDefault();
      var rule_id = e.target.getAttribute('data-rule'),
          li      = e.target.parentNode,
          token   = document.querySelector("input[name='_token']").value;

      this.rules.get(rule_id).destroy({
        success : function(m, response){
          li.parentNode.removeChild(li);
        },
        wait : true, 
        data : ("_token=" + token)
      });
      /*
      var token = document.querySelector("input[name='_token']").value;
      this.model.destroy({wait: true, data : ("_token=" + token)});*/
    },

    // [ GET QUESTION OPTIONS AS AN ARRAY ] 
    //
    //
    _get_options : function(){
      var inputs = this.$('#survey-add-options input[type="text"]'),
          options = [];
      _.each(inputs, function(op){
        if(op.value) options.push(op.value);
      }, this);
      return options;
    },

    // [ GENERATE CSV ]
    //
    //
    _generate_csv : function(e){
      e.preventDefault();
      $.post('/index.php/surveys/make-csv', {}, function(data){
        var anchor     = document.getElementById('get-csv-btn'),
            create_btn = document.querySelector('.create-survey-btn');

        create_btn.style.display = 'none';   
        anchor.href = data.full_path;
        anchor.innerHTML = "generando CSV";
        anchor.setAttribute('target', '_blank');
        anchor.style.display = "";
      }, 'json');
    },

    /*
    // [ UPLOAD RESULTS ]
    //
    //
    _upload_results : function(e){
      // [1] define las variables necesarias
      var files  = e.target.files,
          fData  = new FormData(),
          xhr    = new XMLHttpRequest(),
          url    = "/index.php/surveys/upload-results",
          name   = "results",
          anchor = document.getElementById('get-csv-btn'),
          waitlb = document.getElementById('sending-label'),
          btn    = document.getElementById('send-file-button'),
          file;
      // [2] si no se seleccinó ningún archivo, pelas.
      if(!files.length) return;

      // [3] en caso de tener un archivo seleccionado, lo envía al
      //     servidor mediante AJAX. Al enviar el archivo, el botón 
      //     para seleccionar documento se oculta y aparece el letrero de
      //     "enviando archivo".
      file = files[0];
      fData.append(name, file);
      xhr.open('post', url, true);
      xhr.onload = function(data){
        response = JSON.parse(xhr.responseText);
        if(response.success){
          anchor.href = "/csv/" + response.name;
          anchor.innerHTML = "descargar archivo";
          anchor.setAttribute('target', '_blank');
          anchor.style.display = "";
        }
        waitlb.style.display = "none";
        btn.style.display    = "";
      }
      xhr.send(fData);
      waitlb.style.display = "";
      btn.style.display    = "none";
      // sending-label
      // send-file-button
      // get-csv-btn
    },

    limit_tags : function(e){
      var num = this.$("input[name='" + e.currentTarget.getAttribute("name") + "']:checked").length;
      if(num > 5){
        e.currentTarget.checked = false;
      }
    },

    limit_subs : function(e){
      var num = this.$("input[name='" + e.currentTarget.getAttribute("name") + "']:checked").length;
      if(num > 3){
        e.currentTarget.checked = false;
      }
    },
    */

    //
    // O T H E R   S T U F F
    // --------------------------------------------------------------------------------
    //

    // [ SHOW THE CLOSE SURVEY ALERT ]
    //
    //
    finish_survey_alert : function(e){
      e.preventDefault();
       var url  = $(e.currentTarget).attr("href"),
          title = $(e.currentTarget).attr("data-title");

      swal({
        title: "Terminar encuesta", 
        text: title, 
        type: "warning",
        confirmButtonText : "Terminar",
        //confirmButtonColor: "#ec6c62"
        showCancelButton: true,
        cancelButtonText : "Mejor no",
      }, function(){
        window.location.href = url;
      });
    },

    // [ SHOW THE NEW BANNER ]
    //
    //
    display_banner : function(e){
      // http://stackoverflow.com/questions/17138244/how-to-display-selected-image-without-sending-data-to-server
      // [1] crea el FileReader y una referencia para el input de archivo y el <img>.
      //     Esto no debería generarse para cada llamada, pero pues, no-big-deal.
      var fr     = new FileReader(),
          src    = e.currentTarget,
          target = document.getElementById("target");

      // [2] se define la interacción del FileReader
      fr.onload = function(e) { target.src = this.result; };
      fr.readAsDataURL(src.files[0]);
    },

  });

  return controller;
});