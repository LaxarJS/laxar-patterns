/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../resources',
   'laxar',
   'json-patch'
], function( resources, ax, jsonPatch ) {
   'use strict';

   var portalMocks = ax.testing.portalMocks;
   var myTestModel;

   beforeEach( function() {
      myTestModel = {
         someValue: 'anyValue',
         someNaturalNumbers: [ { number: 1 } ],
         someGermanEnglishDictionary: {
            sausage: 'Wurst',
            beer: 'Bier'
         }
      };
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'A standard didReplace-event handler', function() {

      var handler;
      var scope;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      beforeEach( function() {
         scope = {
            model: {
               myTestModel: null
            }
         };

         handler = resources.replaceHandler( scope, 'myTestModel' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'returns true for non-empty replaces (jira ATP-7339)', function() {
         expect( handler( { data: myTestModel } ) ).toBe( true );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'returns false for empty, idempotent replaces (jira ATP-7339)', function() {
         expect( handler( { data: null } ) ).toBe( false );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sets the resource received from a didReplace event into scope.model[ modelKey ]', function() {
         handler( { data: myTestModel } );

         expect( scope.model.myTestModel ).toEqual( myTestModel );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when scope.resources is defined', function() {

         beforeEach( function() {
            scope.resources = {};

            handler = resources.replaceHandler( scope, 'myTestResource' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'prefers this to scope.model for resource replacements (jira ATP-7144)', function() {
            handler( { data: myTestModel } );

            expect( scope.resources.myTestResource ).toEqual( myTestModel );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when scope.resources is defined in the scope\'s prototype', function() {

         beforeEach( function() {
            function Scope() {}
            Scope.prototype.resources = {};
            scope = new Scope();
            scope.model = {};

            handler = resources.replaceHandler( scope, 'myTestResource' );
            handler( { data: myTestModel } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'ignores inherited properties and still uses the local model property instead (jira ATP-8199)', function() {
            expect( scope.resources ).toEqual( {} );
            expect( scope.model ).toEqual( { myTestResource: myTestModel } );
         } );

      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'A standard didUpdate-event handler', function() {

      var handler;
      var handlerEmptyModel;
      var handlerPrimitive;
      var scope;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      beforeEach( function() {
         scope = {
            model: {
               myTestModel:{
                  someValue: 'anyValue',
                  someNaturalNumbers: [ { number: 1 } ]
               },
               primitive: true
            }
         };

         handler = resources.updateHandler( scope, 'myTestModel' );
         handlerEmptyModel = resources.updateHandler( scope, 'myTestModelEmpty' );
         handlerPrimitive = resources.updateHandler( scope, 'primitive' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'returns true for non-empty updates (jira ATP-7339)', function() {
         expect( handler( { updates: { 'someKey': 12 } } ) ).toBe( true );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'returns false for empty, idempotent empty updates (jira ATP-7339)', function() {
         expect( handlerEmptyModel( { updates: {} } ) ).toBe( false );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when data attribute is given', function() {

         it( 'applies all attributes to an existing object in scope.model[ modelKey ]', function() {
            handler( { data: myTestModel } );

            expect( scope.model.myTestModel ).toEqual( myTestModel );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'uses all attributes for a new object when scope.model[ modelKey ] is empty', function() {
            handlerEmptyModel( { data: myTestModel } );

            expect( scope.model.myTestModelEmpty ).toEqual( myTestModel );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sets the value to the model for primitive types', function() {
            handlerPrimitive( { data: false } );

            expect( scope.model.primitive ).toBe( false );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when updates attribute is given', function() {

         it( 'applies all entries as patches to the object', function() {
            handler( {
               updates: {
                  'someGermanEnglishDictionary.sausage': 'Wurst',
                  'someGermanEnglishDictionary.beer': 'Bier'
               }
            } );

            expect( scope.model.myTestModel ).toEqual( myTestModel );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when both are given', function() {

         it( 'first applies attributes given in data', function() {
            handler( {
               data: {
                  someNaturalNumbers: [ { number: 2 } ]
               },
               updates: {
                  'someGermanEnglishDictionary.sausage': 'Wurst',
                  'someGermanEnglishDictionary.beer': 'Bier',
                  'someNaturalNumbers.0.number': 1
               }
            } );

            expect( scope.model.myTestModel ).toEqual( myTestModel );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when patches is given', function() {

         var patches;
         var expected;

         beforeEach( function() {
            patches = [
               { op: 'add', path: '/anotherProperty', value: 'hello patch' },
               { op: 'remove', path: '/someNaturalNumbers/0/number' }
            ];
            expected = {
               someValue: 'anyValue',
               anotherProperty: 'hello patch',
               someNaturalNumbers: [ {} ]
            };
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'uses jsonpatch to apply them to the model', function() {
            handler( { patches: patches } );

            expect( scope.model.myTestModel ).toEqual( expected );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'ignores changes from data or updates fields', function() {
            handler( {
               patches: patches,
               data: {
                  someNaturalNumbers: [ { number: 2 } ]
               },
               updates: {
                  'someGermanEnglishDictionary.sausage': 'Wurst',
                  'someGermanEnglishDictionary.beer': 'Bier',
                  'someNaturalNumbers.0.number': 1
               }
            } );

            expect( scope.model.myTestModel ).toEqual( expected );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when scope.resources is defined', function() {

         beforeEach( function() {
            scope.resources = {
               myTestResource: {
                  someValue: 'anyValue',
                  someNaturalNumbers: [ { number: 1 } ]
               }
            };

            handler = resources.updateHandler( scope, 'myTestResource' );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'prefers this to scope.model for resource updates (jira ATP-7144)', function() {
            handler( {
               updates: {
                  'someGermanEnglishDictionary.sausage': 'Wurst',
                  'someGermanEnglishDictionary.beer': 'Bier'
               }
            } );

            expect( scope.resources.myTestResource ).toEqual( myTestModel );
         } );

      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'A standard didReplace-event publisher', function() {

      var publisher;
      var scope;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      beforeEach( function() {
         scope = {
            eventBus: portalMocks.mockEventBus(),
            features: {
               superFeature: {
                  superAttribute: {
                     resource: 'cheese'
                  }
               }
            }
         };

         publisher = resources.replacePublisherForFeature( scope, 'superFeature.superAttribute' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'creates a function to send didReplace events', function() {
         publisher( {
            type: 'Gouda jung',
            country: 'netherlands'
         } );

         expect( scope.eventBus.publish )
            .toHaveBeenCalledWith( 'didReplace.cheese', {
               resource: 'cheese',
               data: {
                  type: 'Gouda jung',
                  country: 'netherlands'
               }
            }, {
               deliverToSender: false
            } );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'A standard didUpdate-event publisher', function() {

      var publisher;
      var scope;

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      beforeEach( function() {
         scope = {
            eventBus: portalMocks.mockEventBus(),
            features: {
               superFeature: {
                  superAttribute: {
                     resource: 'cheese'
                  }
               }
            }
         };

         publisher = resources.updatePublisherForFeature( scope, 'superFeature.superAttribute' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'creates a function to send didUpdate events with data', function() {
         publisher( null, {
            type: 'Gouda alt'
         } );

         expect( scope.eventBus.publish )
            .toHaveBeenCalledWith( 'didUpdate.cheese', {
               resource: 'cheese',
               data: {
                  type: 'Gouda alt'
               }
            }, {
               deliverToSender: false
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'creates a function to send didUpdate events with updates', function() {
         publisher( {
            'hose.0': '3cm'
         }, null );

         expect( scope.eventBus.publish )
            .toHaveBeenCalledWith( 'didUpdate.cheese', {
               resource: 'cheese',
               updates: {
                  'hose.0': '3cm'
               }
            }, {
               deliverToSender: false
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'creates a function to send didUpdate events with patches', function() {
         publisher( null, null, [ { op: 'replace', path: '/hose/0', value: '3cm' } ] );

         expect( scope.eventBus.publish )
            .toHaveBeenCalledWith( 'didUpdate.cheese', {
               resource: 'cheese',
               patches: [ { op: 'replace', path: '/hose/0', value: '3cm' } ]
            }, {
               deliverToSender: false
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'allows to restrict the function to only accept patches', function() {
         publisher = resources.updatePublisherForFeature( scope, 'superFeature.superAttribute', {
            jsonPatchOnly: true
         } );

         publisher( [ { op: 'replace', path: '/hose/0', value: '3cm' } ] );

         expect( scope.eventBus.publish )
            .toHaveBeenCalledWith( 'didUpdate.cheese', {
               resource: 'cheese',
               patches: [ { op: 'replace', path: '/hose/0', value: '3cm' } ]
            }, {
               deliverToSender: false
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'adds a method to the returned function', function() {

         var from;
         var to;
         var patches;

         beforeEach( function() {
            from = {
               type: 'Gouda jung',
               country: 'netherlands'
            };
            to = {
               type: 'Gouda alt',
               country: 'netherlands',
               sold: true
            };
            patches = jsonPatch.compare( JSON.parse( JSON.stringify( from ) ), to );

            spyOn( jsonPatch, 'compare' ).andCallThrough();
            publisher.compareAndPublish( from, to );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'that creates patches using json patch', function() {
            expect( jsonPatch.compare ).toHaveBeenCalledWith( from, to );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'that directly publishes a didUpdate event using the patches', function() {
            expect( scope.eventBus.publish )
               .toHaveBeenCalledWith( 'didUpdate.cheese', {
                  resource: 'cheese',
                  patches: patches
               }, {
                  deliverToSender: false
               } );
         } );

      } );


   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'A ResourceHandler', function() {

      var scope;
      var featureOptions;
      var resourceHandler;
      var onReplaceSausageSpy;
      var onUpdateSausageSpy;
      var onReplaceCheeseSpy;
      var onUpdateCheeseSpy;
      var onAllReplacedSpy;

      beforeEach( function() {
         scope = {
            eventBus: portalMocks.mockEventBus(),
            features: {
               superFeature: {
                  superAttribute: {
                     resource: 'cheese'
                  }
               },
               missingOptional: {
                  resource: null
               },
               completelyMissingOptional: { }
            },
            model: {}
         };
         onReplaceSausageSpy = jasmine.createSpy( 'onReplaceSausageSpy' );
         onUpdateSausageSpy = jasmine.createSpy( 'onUpdateSausageSpy' );
         onReplaceCheeseSpy = jasmine.createSpy( 'onReplaceCheeseSpy' );
         onUpdateCheeseSpy = jasmine.createSpy( 'onUpdateCheeseSpy' );
         onAllReplacedSpy = jasmine.createSpy( 'onAllReplacedSpy' );

         featureOptions = {
            onReplace: onReplaceCheeseSpy,
            onUpdate: onUpdateCheeseSpy,
            omitFirstReplace: true
         };

         resourceHandler = resources.handlerFor( scope )
            .registerResourceFromFeature( 'superFeature.superAttribute', featureOptions )
            .registerResource( 'sausage', {
               onReplace: onReplaceSausageSpy,
               onUpdate: onUpdateSausageSpy
            } )
            .whenAllWereReplaced( onAllReplacedSpy );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'does not create subscriptions for missing optional resources', function() {
         expect( function() {
            resourceHandler.registerResourceFromFeature( 'completelyMissingOptional', {
               isOptional: true,
               onUpdateReplace: function() {}
            } );
         } ).not.toThrow();

         expect( function() {
            resourceHandler.registerResourceFromFeature( 'missingOptional', {
               isOptional: true,
               onUpdate: function() {}
            } );
         } ).not.toThrow();

         expect( scope.eventBus.subscribe ).not.toHaveBeenCalledWith(
            'didReplace.missingOptional', jasmine.any( Function )
         );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to didReplace events of the given features', function() {
         expect( scope.eventBus.subscribe )
            .toHaveBeenCalledWith( 'didReplace.cheese', jasmine.any( Function ) );
         expect( scope.eventBus.subscribe )
            .toHaveBeenCalledWith( 'didReplace.sausage', jasmine.any( Function ) );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'subscribes to didUpdate events of the given features', function() {
         expect( scope.eventBus.subscribe )
            .toHaveBeenCalledWith( 'didUpdate.cheese', jasmine.any( Function ) );
         expect( scope.eventBus.subscribe )
            .toHaveBeenCalledWith( 'didUpdate.sausage', jasmine.any( Function ) );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'does not modify the options object passed to the register function (i.e. makes a copy) (jira ATP-7618)', function() {
         expect( featureOptions ).toEqual( {
            onReplace: onReplaceCheeseSpy,
            onUpdate: onUpdateCheeseSpy,
            omitFirstReplace: true
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when an empty didReplace event is published', function() {

         beforeEach( function() {
            scope.eventBus.publish( 'didReplace.sausage', {
               data: null
            }, {
               sender: 'spec'
            } );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'the replacement observers will not be called (jira ATP-7339)', function() {
            expect( onReplaceSausageSpy ).not.toHaveBeenCalled();
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when an empty didUpdate event is published', function() {

         beforeEach( function() {
            scope.eventBus.publish( 'didUpdate.sausage', {
               data: null
            }, {
               sender: 'spec'
            } );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'the update observers will not be called (jira ATP-7339)', function() {
            expect( onUpdateSausageSpy ).not.toHaveBeenCalled();
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when a didReplace event is published', function() {

         var sausage;
         var cheese;

         beforeEach( function() {
            sausage = {
               diameter: '5cm',
               length: '30cm',
               type: 'salami'
            };
            cheese = {
               smelliness: 'high',
               softness: 'medium'
            };
            scope.eventBus.publish( 'didReplace.sausage', {
               resource: 'sausage',
               data: sausage
            }, {
               sender: 'spec'
            } );
            scope.eventBus.publish( 'didReplace.cheese', {
               resource: 'cheese',
               data: cheese
            }, {
               sender: 'spec'
            } );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'sets the values as new model on the scope', function() {
            expect( scope.model.sausage ).toEqual( sausage );
            expect( scope.model.superAttribute ).toEqual( cheese );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'calls the according handler with the event that occurred', function() {
            expect( onReplaceSausageSpy ).toHaveBeenCalled();
            expect( onReplaceSausageSpy.calls[0].args[0].data ).toEqual( {
               diameter: '5cm',
               length: '30cm',
               type: 'salami'
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'doesn\'t call the handler instantly if omitFirstReplace is true', function() {
            expect( onReplaceCheeseSpy ).not.toHaveBeenCalled();

            scope.eventBus.publish( 'didReplace.cheese', {
               data: cheese
            }, {
               sender: 'spec'
            } );
            jasmine.Clock.tick( 0 );

            expect( onReplaceCheeseSpy ).toHaveBeenCalled();
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when a didUpdate event is published', function() {

         var sausage;

         beforeEach( function() {
            scope.model.sausage = {
               diameter: '5cm',
               length: '30cm',
               type: 'salami'
            };
            scope.eventBus.publish( 'didUpdate.sausage', {
               resource: 'sausage',
               updates: {
                  type: 'bockwurst'
               },
               data: {
                  length: '15cm'
               }
            }, {
               sender: 'spec'
            } );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'applies the updates to the model', function() {
            expect( scope.model.sausage ).toEqual( {
               diameter: '5cm',
               length: '15cm',
               type: 'bockwurst'
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'calls the according handler with the event that occurred', function() {
            expect( onUpdateSausageSpy ).toHaveBeenCalled();
            expect( onUpdateSausageSpy.calls[0].args[0].data ).toEqual( { length: '15cm' } );
            expect( onUpdateSausageSpy.calls[0].args[0].updates ).toEqual( { type: 'bockwurst' } );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when multiple handlers for the same resource are registered', function() {

         describe( 'by different collaborators', function() {

            var anotherSausageSpy;

            beforeEach( function() {
               anotherSausageSpy = jasmine.createSpy( 'anotherSausageSpy' );
               resourceHandler.registerResource( 'sausage', {
                  onReplace: anotherSausageSpy,
                  onUpdate: anotherSausageSpy
               } );

               scope.eventBus.publish( 'didReplace.sausage', { resource: 'sausage', data: {} }, { sender: 'spec' } );
               scope.eventBus.publish( 'didUpdate.sausage', { resource: 'sausage', data: {} }, { sender: 'spec' } );
               jasmine.Clock.tick( 0 );
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'calls all of the handlers for the same resource on replace (jira ATP-7312)', function() {
               expect( onReplaceSausageSpy ).toHaveBeenCalled();
               expect( anotherSausageSpy ).toHaveBeenCalled();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'calls all of the handlers for the same resource on update (jira ATP-7312)', function() {
               expect( onUpdateSausageSpy ).toHaveBeenCalled();
               expect( anotherSausageSpy ).toHaveBeenCalled();
            } );

         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         describe( 'using an array of handler functions', function() {

            var cheeseSpyOne;
            var cheeseSpyTwo;

            beforeEach( function() {
               cheeseSpyOne = jasmine.createSpy( 'cheeseSpyOne' );
               cheeseSpyTwo = jasmine.createSpy( 'cheeseSpyTwo' );
               resourceHandler.registerResource( 'cheese', {
                  onReplace: [ cheeseSpyOne, cheeseSpyTwo ],
                  onUpdate: [ cheeseSpyOne, cheeseSpyTwo ]
               } );

               scope.eventBus.publish( 'didReplace.cheese', { resource: 'cheese', data: {} }, { sender: 'spec' } );
               jasmine.Clock.tick( 0 );
            } );

            /////////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'calls all handlers on replace (jira ATP-7455)', function() {
               expect( cheeseSpyOne ).toHaveBeenCalled();
               expect( cheeseSpyTwo ).toHaveBeenCalled();
            } );

            /////////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'calls all handlers on update (jira ATP-7455)', function() {
               cheeseSpyOne.reset();
               cheeseSpyTwo.reset();

               scope.eventBus.publish( 'didUpdate.cheese', { resource: 'cheese', data: {} }, { sender: 'spec' } );
               jasmine.Clock.tick( 0 );

               expect( cheeseSpyOne ).toHaveBeenCalled();
               expect( cheeseSpyTwo ).toHaveBeenCalled();
            } );

         } );

      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a watch option for whenAllWereReplaced', function() {

         var watchSpy;

         beforeEach( function() {
            watchSpy = jasmine.createSpy( 'cheeseSpyOne' );
            resourceHandler = resources.handlerFor( scope )
               .registerResourceFromFeature( 'superFeature.superAttribute' )
               .registerResource( 'sausage', { } )
               .whenAllWereReplaced( watchSpy, { watch: true } );

            scope.eventBus.publish( 'didReplace.sausage', { resource: 'sausage', data: {} }, { sender: 'spec' } );
            scope.eventBus.publish( 'didUpdate.sausage', { resource: 'sausage', updates: { x: 5 } }, { sender: 'spec' } );
            scope.eventBus.publish( 'didReplace.cheese', { resource: 'cheese', data: {} }, { sender: 'spec' } );
         } );

         it( 'continues to inform handlers about changes to their resources', function() {
            jasmine.Clock.tick( 0 );
            expect( watchSpy ).toHaveBeenCalled();
            expect( watchSpy.calls.length ).toEqual( 1 );

            scope.eventBus.publish(
               'didReplace.sausage',
               { resource: 'sausage', data: { newData: true } },
               { sender: 'spec' }
            );
            jasmine.Clock.tick( 0 );
            expect( watchSpy.calls.length ).toEqual( 2 );

            scope.eventBus.publish(
               'didUpdate.sausage',
               { resource: 'sausage', updates: { newData: false } },
               { sender: 'spec' }
            );
            jasmine.Clock.tick( 0 );
            expect( watchSpy.calls.length ).toEqual( 3 );
         } );

      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'without a watch option for whenAllWereReplaced', function() {

         var watchSpy;

         beforeEach( function() {
            watchSpy = jasmine.createSpy( 'cheeseSpyOne' );
            resourceHandler = resources.handlerFor( scope )
               .registerResourceFromFeature( 'superFeature.superAttribute' )
               .registerResource( 'sausage', { } )
               .whenAllWereReplaced( watchSpy );

            scope.eventBus.publish( 'didReplace.sausage', { resource: 'sausage', data: {} }, { sender: 'spec' } );
            scope.eventBus.publish( 'didReplace.cheese', { resource: 'cheese', data: {} }, { sender: 'spec' } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'does not continue to inform handlers about changes to their resources', function() {
            jasmine.Clock.tick( 0 );
            expect( watchSpy ).toHaveBeenCalled();
            expect( watchSpy.calls.length ).toEqual( 1 );

            scope.eventBus.publish(
               'didReplace.sausage',
               { resource: 'sausage', data: { newData: true } },
               { sender: 'spec' }
                 );
            jasmine.Clock.tick( 0 );
            expect( watchSpy.calls.length ).toEqual( 1 );

            scope.eventBus.publish(
               'didUpdate.sausage',
               { resource: 'sausage', updates: { newData: false } },
               { sender: 'spec' }
            );
            jasmine.Clock.tick( 0 );
            expect( watchSpy.calls.length ).toEqual( 1 );
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a method to wait for all initial replaces (whenAllWereReplaced)', function() {

         var sausage;
         var cheese;

         beforeEach( function() {
            sausage = {
               diameter: '5cm',
               length: '30cm',
               type: 'salami'
            };
            cheese = {
               smelliness: 'high',
               softness: 'medium'
            };
            scope.eventBus.publish( 'didReplace.sausage', {
               resource: 'sausage',
               data: sausage
            }, {
               sender: 'spec'
            } );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'doesn\'t call the callback when not all resources were replaced', function() {
            expect( onAllReplacedSpy ).not.toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'calls the callback when all resources were replaced', function() {
            scope.eventBus.publish( 'didReplace.cheese', {
               resource: 'cheese',
               data: cheese
            }, {
               sender: 'spec'
            } );
            jasmine.Clock.tick( 0 );

            expect( onAllReplacedSpy ).toHaveBeenCalled();
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a method to check for receipt of resource (wereAllReplaced)', function() {

         var sausage;
         var cheese;

         beforeEach( function() {
            sausage = { type: 'salami' };
            cheese = { smelliness: 'high' };
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'tells when not all resources have been replaced', function() {
            expect( resourceHandler.wereAllReplaced() ).toBe( false );

            scope.eventBus.publish( 'didReplace.sausage', {
               resource: 'sausage',
               data: sausage
            }, { sender: 'spec' } );
            jasmine.Clock.tick( 0 );
            expect( resourceHandler.wereAllReplaced() ).toBe( false );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'tells when all resources have been replaced', function() {
            scope.eventBus.publish( 'didReplace.cheese', {
               resource: 'cheese',
               data: cheese
            }, { sender: 'spec' } );
            scope.eventBus.publish( 'didReplace.sausage', {
               resource: 'sausage',
               data: sausage
            }, { sender: 'spec' } );
            jasmine.Clock.tick( 0 );

            expect( resourceHandler.wereAllReplaced() ).toBe( true );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'combined as onUpdateReplace handlers', function() {

         var sausageSpy;
         var cheeseSpyOne;
         var cheeseSpyTwo;

         beforeEach( function() {
            sausageSpy = jasmine.createSpy( 'sausageSpy' );
            cheeseSpyOne = jasmine.createSpy( 'cheeseSpyOne' );
            cheeseSpyTwo = jasmine.createSpy( 'cheeseSpyTwo' );
            resourceHandler.registerResource( 'sausage', {
               onUpdateReplace: sausageSpy
            } );
            resourceHandler.registerResource( 'cheese', {
               onUpdateReplace: [ cheeseSpyOne, cheeseSpyTwo ]
            } );

            scope.eventBus.publish( 'didReplace.sausage', { resource: 'sausage', data: {} }, { sender: 'spec' } );
            scope.eventBus.publish( 'didReplace.cheese', { resource: 'cheese', data: {} }, { sender: 'spec' } );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'calls single and multiple handlers on replace (jira ATP-7455)', function() {
            expect( sausageSpy ).toHaveBeenCalled();
            expect( cheeseSpyOne ).toHaveBeenCalled();
            expect( cheeseSpyTwo ).toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'calls single and multiple handlers on update (jira ATP-7455)', function() {
            sausageSpy.reset();
            cheeseSpyOne.reset();
            cheeseSpyTwo.reset();

            scope.eventBus.publish( 'didUpdate.sausage', { resource: 'sausage', data: {} }, { sender: 'spec' } );
            scope.eventBus.publish( 'didUpdate.cheese', { resource: 'cheese', data: {} }, { sender: 'spec' } );
            jasmine.Clock.tick( 0 );

            expect( sausageSpy ).toHaveBeenCalled();
            expect( cheeseSpyOne ).toHaveBeenCalled();
            expect( cheeseSpyTwo ).toHaveBeenCalled();
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'when the same resource is registered from different features', function() {

         function numberOfSubscribes( eventName ) {
            return scope.eventBus.subscribe.calls.filter( function( call ) {
               return call.args[0] === eventName;
            } ).length;
         }

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         beforeEach( function() {
            scope = {
               eventBus: portalMocks.mockEventBus(),
               features: {
                  superFeature: {
                     superAttribute: {
                        resource: 'cheese'
                     },
                     superAttributeTwo: {
                        resource: 'cheese'
                     }
                  }
               }
            };

            featureOptions = {
               onReplace: onReplaceCheeseSpy,
               onUpdate: onUpdateCheeseSpy
            };
            resourceHandler = resources.handlerFor( scope )
               .registerResourceFromFeature( 'superFeature.superAttribute', featureOptions )
               .registerResourceFromFeature( 'superFeature.superAttributeTwo', featureOptions );

            scope.eventBus.publish( 'didReplace.cheese', { resource: 'cheese', data: {} }, { sender: 'spec' } );
            scope.eventBus.publish( 'didUpdate.cheese', { resource: 'cheese', data: {} }, { sender: 'spec' } );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'a subscription to didReplace takes place only once (jira ATP-7618)', function() {
            expect( numberOfSubscribes( 'didReplace.cheese' ) ).toBe( 1 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'a subscription to didUpdate takes place only once (jira ATP-7618)', function() {
            expect( numberOfSubscribes( 'didUpdate.cheese' ) ).toBe( 1 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'only calls the according replace handler for the times it was registered (jira ATP-7618)', function() {
            expect( onReplaceCheeseSpy.calls.length ).toBe( 2 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'only calls the according update handler for the times it was registered (jira ATP-7618)', function() {
            expect( onUpdateCheeseSpy.calls.length ).toBe( 2 );
         } );

      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////


} );
