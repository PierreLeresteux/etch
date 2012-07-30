(function() {
  'use strict';
    
  var models = {},
    views = {},
    collections = {},
    etch = {};
	
  // versioning as per semver.org
  etch.VERSION = '0.6.2';

  etch.config = {
    // selector to specify editable elements   
    selector: '.editable',
      
    // Named sets of buttons to be specified on the editable element
    // in the markup as "data-button-class"   
    buttonClasses: {
      'default': ['save'],
      'compact': [['format', 'bold','italic','underline'],['list','unordered-list', 'ordered-list'], ['justify','justify-left','justify-center','justify-right'],['font-size','size xs', 'size s', 'size m', 'size l', 'size xl'],'link','save'],
      'all': ['bold', 'italic', 'underline', 'unordered-list', 'ordered-list', 'link', 'clear-formatting', 'save'],
      'title': ['bold', 'italic', 'underline', 'save']
    }
  };

  models.Editor = Backbone.Model;

  views.Editor = Backbone.View.extend({
    initialize: function() {
      this.$el = $(this.el);
            
      // Model attribute event listeners:
      _.bindAll(this, 'changeButtons', 'changePosition', 'changeEditable', 'insertImage');
      this.model.bind('change:buttons', this.changeButtons);
      this.model.bind('change:position', this.changePosition);
      this.model.bind('change:editable', this.changeEditable);

      // Init Routines:
      this.changeEditable();
    },

    events: {
      'click .etch-bold': 'toggleBold',
      'click .etch-italic': 'toggleItalic',
      'click .etch-underline': 'toggleUnderline',
      'click .etch-heading': 'toggleHeading',
      'click .etch-unordered-list': 'toggleUnorderedList',
      'click .etch-justify-left': 'justifyLeft',
      'click .etch-justify-center': 'justifyCenter',
      'click .etch-justify-right': 'justifyRight',
      'click .etch-ordered-list': 'toggleOrderedList',
      'click .etch-link': 'openLinkInput',
      'click .etch-image': 'getImage',
      'click .etch-save': 'save',
      'click .etch-clear-formatting': 'clearFormatting',
      'click .etch-editor-buttonEntry': 'entryMenu',
      'click .etch-editor-entry': 'closeAllEntryMenu',
      'click .etch-size': 'changeFontSize',
      'keydown .etch-editor-input': 'toggleLink'
    },
        
    changeEditable: function() {
      this.setButtonClass();
      // Im assuming that Ill add more functionality here
    },
    entryMenu: function(e) {

      var $target = $(e.target || e.srcElement);
      var entryNumber = $target.data('entry');
      var display = $target.attr('data-display');
      this.closeAllEntryMenu();
      if (display == 'false'){
        $('.etch-editor-entry[data-entry="'+entryNumber+'"]').show('fast');
        $target.attr('data-display','true');
      } 
    },
    closeAllEntryMenu: function() {
      $('.etch-editor-entry').hide('fast');
      $('.etch-editor-buttonEntry span[data-display="true"]').attr('data-display','false');
    },
    setButtonClass: function() {
      // check the button class of the element being edited and set the associated buttons on the model
      var editorModel = this.model;
      var buttonClass = editorModel.get('editable').attr('data-button-class') || 'default';
      editorModel.set({ buttons: etch.config.buttonClasses[buttonClass] });
    },

    changeButtons: function() {
      // render the buttons into the editor-panel
      this.$el.empty();
      var view = this;
      var buttons = this.model.get('buttons');
      var entryNumber = 0;
      var nbButton = 0;
      // hide editor panel if there are no buttons in it and exit early
      if (!buttons.length) { $(this.el).hide(); return; }
            
      _.each(this.model.get('buttons'), function(button){
        if (!_.isArray(button)){
          var $buttonEl = $('<a href="#" class="etch-editor-button etch-'+ button +'" title="'+ button.replace('-', ' ') +'"><span></span></a>');
          view.$el.append($buttonEl);
          if (button == 'link'){
            var $linkEditor = $('<span class="etch-editor-inputcontainer" style="top:41px;left:0" ><input class="etch-editor-input" type="text" name="link" /></span>');
            view.$el.append($linkEditor);
          }
        }else{
          var entry;
          var nbElement=0;
          _.each(button, function(buttonEntry){
            if (entry==undefined) {
              entry = buttonEntry;
              var $buttonEl = $('<a href="#" class="etch-editor-button etch-editor-buttonEntry etch-'+ entry +'" title="'+ entry.replace('-', ' ') +'"><span data-entry="'+entryNumber+'" data-display="false"></span></a>');
              view.$el.append($buttonEl);
            }else{
              var swiftTop = nbElement * 32 + 5;
              var swiftLeft = nbButton * 32 + 5;
              var $entryEl = $('<a style="top:'+swiftTop+'px;left:'+swiftLeft+'px" data-entry="'+entryNumber+'" href="#" class="etch-editor-button etch-editor-entry etch-'+ buttonEntry +'" title="'+ buttonEntry.replace('-', ' ') +'"><span></span></a>');
              view.$el.append($entryEl);
            }
            nbElement++;
          });
          entryNumber++;
        }
        nbButton++;
      });
            
      $(this.el).show('fast');
    },

    changePosition: function() {
      // animate editor-panel to new position
      var pos = this.model.get('position');
      this.$el.animate({'top': pos.y, 'left': pos.x}, { queue: false });
    },
        
    wrapSelection: function(selectionOrRange, elString, cb) {
      // wrap current selection with elString tag
      var range = selectionOrRange === Range ? selectionOrRange : selectionOrRange.getRangeAt(0);
      var el = document.createElement(elString);
      range.surroundContents(el);
    },
        
    clearFormatting: function(e) {
      e.preventDefault();
      document.execCommand('removeFormat', false, null);
    },
        
    toggleBold: function(e) {
      e.preventDefault();
      document.execCommand('bold', false, null);
    },

    toggleItalic: function(e) {
      e.preventDefault();
      document.execCommand('italic', false, null);
    },

    toggleUnderline: function(e) {
      e.preventDefault();
      document.execCommand('underline', false, null);
    },
        
    toggleHeading: function(e) {
      e.preventDefault();
      var range = window.getSelection().getRangeAt(0);
      var wrapper = range.commonAncestorContainer.parentElement
      if ($(wrapper).is('h3')) {
        $(wrapper).replaceWith(wrapper.textContent)
        return;
      }
      var h3 = document.createElement('h3');
      range.surroundContents(h3);
    },
    openLinkInput: function(e) {
      e.preventDefault();
      var range = window.getSelection().getRangeAt(0);
      this.rangeLink = range;
      // are we in an anchor element?
      if (range.startContainer.parentNode.tagName === 'A' || range.endContainer.parentNode.tagName === 'A') {
        var $element = $(range.endContainer.parentNode);
        if (range.startContainer.parentNode.tagName === 'A')
          $element = $(range.startContainer.parentNode);
        $('input[name=link]').val($element.attr("href"));
      } else {
        $('input[name=link]').val('http://');
      }
      $('.etch-editor-inputcontainer').toggle('fast');
    },
    toggleLink: function(e) {
      if (e.keyCode === 13){
        $('.etch-editor-inputcontainer').hide('fast');
        var range = this.rangeLink;
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        var val = $('input[name=link]').val();
        if (val!='') {
          document.execCommand('createlink', false, val);
        } else {
          document.execCommand('unlink', false,null );
        }
        $('input[name=link]').val('http://');
        e.preventDefault();
      }
    },
    toggleUnorderedList: function(e) {
      e.preventDefault();
      document.execCommand('insertUnorderedList', false, null);
    },

    toggleOrderedList: function(e){
      e.preventDefault();
      document.execCommand('insertOrderedList', false, null);
    },
        
    justifyLeft: function(e) {
      e.preventDefault();
      document.execCommand('justifyLeft', false, null);
    },

    justifyCenter: function(e) {
      e.preventDefault();
      document.execCommand('justifyCenter', false, null);
    },

    justifyRight: function(e) {
      e.preventDefault();
      document.execCommand('justifyRight', false, null);
    },

    changeFontSize : function(e) {
      e.preventDefault();
      var size = 0;
      var $target = $(e.target || e.srcElement).parent();
      if ($target.hasClass('xs')){
        size = 1;
      } else if ($target.hasClass('s')){
        size = 2;
      } else if ($target.hasClass('m')){
        size = 3;
      } else if ($target.hasClass('l')){
        size = 4;
      } else if ($target.hasClass('xl')){
        size = 5;
      } 
      document.execCommand('fontSize', false, size);
    },
    getImage: function(e) {
      e.preventDefault();

      // call startUploader with callback to handle inserting it once it is uploded/cropped
      this.startUploader(this.insertImage);
    },
        
    startUploader: function(cb) {
      // initialize Image Uploader
      var model = new models.ImageUploader();
      var view = new views.ImageUploader({model: model});
            
      // stash a reference to the callback to be called after image is uploaded
      model._imageCallback = function(image) {
        view.startCropper(image, cb);
      };


      // stash reference to saved range for inserting the image once its 
      this._savedRange = window.getSelection().getRangeAt(0);

      // insert uploader html into DOM
      $('body').append(view.render().el);
    },
        
    insertImage: function(image) {
      // insert image - passed as a callback to startUploader
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(this._savedRange);
            
      var attrs = {
        'editable': this.model.get('editable'),
        'editableModel': this.model.get('editableModel')
      };
            
      _.extend(attrs, image);

      var model = new models.EditableImage(attrs);
      var view = new views.EditableImage({model: model});
      this._savedRange.insertNode($(view.render().el).addClass('etch-float-left')[0]);
    },
        
    save: function(e) {
      e.preventDefault();
      var editableModel = this.model.get('editableModel');
      editableModel.trigger('save');
    }
  });

  // tack on models, views, etc... as well as init function
  _.extend(etch, {
    models: models,
    views: views,
    collections: collections,

    // This function is to be used as callback to whatever event
    // you use to initialize editing 
    editableInit: function(e) {
      e.stopPropagation();
      var target = e.target || e.srcElement;
      var $editable = $(target).etchFindEditable();
      $editable.attr('contenteditable', true);

      // if the editor isn't already built, build it
      var $editor = $('.etch-editor-panel');
      var editorModel = $editor.data('model');
      if (!$editor.size()) {
        $editor = $('<div class="etch-editor-panel">');
        var editorAttrs = { editable: $editable, editableModel: this.model };
        document.body.appendChild($editor[0]);
        $editor.etchInstantiate({classType: 'Editor', attrs: editorAttrs});
        editorModel = $editor.data('model');

      // check if we are on a new editable
      } else if ($editable[0] !== editorModel.get('editable')[0]) {
        // set new editable
        editorModel.set({
          editable: $editable,
          editableModel: this.model
        });
      }
      
      // Firefox seems to be only browser that defaults to `StyleWithCSS == true`
      // so we turn it off here. Plus a try..catch to avoid an error being thrown in IE8.
      try {
        document.execCommand('StyleWithCSS', false, false);
      }
      catch (err) {
        // expecting to just eat IE8 error, but if different error, rethrow
        if (err.message !== "Invalid argument.") {
          throw err;
        }
      }

      if (models.EditableImage) {
        // instantiate any images that may be in the editable
        var $imgs = $editable.find('img');
        if ($imgs.size()) {
          var attrs = { editable: $editable, editableModel: this.model };
          $imgs.each(function() {
            var $this = $(this);
            if (!$this.data('editableImageModel')) {
              var editableImageModel =  new models.EditableImage(attrs);
              var editableImageView = new views.EditableImage({model: editableImageModel, el: this, tagName: this.tagName});
              $this.data('editableImageModel', editableImageModel);
            }
          });
        }
      }

      // listen for mousedowns that are not coming from the editor
      // and close the editor
      $('body').bind('mousedown.editor', function(e) {
        // check to see if the click was in an etch tool
        var target = e.target || e.srcElement;
        if ($(target).not('.etch-editor-panel, .etch-editor-panel *, .etch-image-tools, .etch-image-tools *').size()) {
          // remove editor
          $editor.remove();
                    
                    
          if (models.EditableImage) {
            // unblind the image-tools if the editor isn't active
            $editable.find('img').unbind('mouseenter');

            // remove any latent image tool model references
            $(etch.config.selector+' img').data('editableImageModel', false)
          }
                    
          // once the editor is removed, remove the body binding for it
          $(this).unbind('mousedown.editor');
        }
      });

      editorModel.set({position: {x: e.pageX - 15, y: e.pageY - 80}});
    }
  });

  // jquery helper functions
  $.fn.etchInstantiate = function(options, cb) {
    return this.each(function() {
      var $el = $(this);
      options || (options = {});

      var settings = {
        el: this,
        attrs: {}
      }

      _.extend(settings, options);

      var model = new models[settings.classType](settings.attrs, settings);

      // initialize a view is there is one
      if (_.isFunction(views[settings.classType])) {
        var view = new views[settings.classType]({model: model, el: this, tagName: this.tagName});
      }
           
      // stash the model and view on the elements data object
      $el.data({model: model});
      $el.data({view: view});

      if (_.isFunction(cb)) {
        cb({model: model, view: view});
      }
    });
  }

  $.fn.etchFindEditable = function() {
    // function that looks for the editable selector on itself or its parents
    // and returns that el when it is found
    var $el = $(this);
    return $el.is(etch.config.selector) ? $el : $el.closest(etch.config.selector);
  }
    
  window.etch = etch;
})();
