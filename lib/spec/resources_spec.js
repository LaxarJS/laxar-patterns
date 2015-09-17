/**
 * Copyright 2014 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
define( [
   '../resources',
   'laxar/laxar_testing',
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

      beforeEach( function() {
         scope = {
            resources: {
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

      it( 'sets the resource received from a didReplace event into scope.resources[ modelKey ]', function() {
         handler( { data: myTestModel } );

         expect( scope.resources.myTestModel ).toEqual( myTestModel );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'A standard didUpdate-event handler', function() {

      var handler;
      var handlerEmptyModel;
      var handlerPrimitive;
      var scope;

      beforeEach( function() {
         scope = {
            resources: {
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
         expect( handler( { patches: [ { op: 'add', path: '/someKey', value: 12 } ] } ) ).toBe( true );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'returns false for empty, idempotent empty updates (jira ATP-7339)', function() {
         expect( handlerEmptyModel( {} ) ).toBe( false );
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

            expect( scope.resources.myTestModel ).toEqual( expected );
         } );

      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'A standard didReplace-event publisher', function() {

      var publisher;
      var scope;

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

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'returns a promise when called (#17)', function() {
         var promise = publisher( {
            type: 'Gouda jung',
            country: 'netherlands'
         } );

         expect( typeof promise.then ).toEqual( 'function' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'forwards the deliverToSender option to the event bus (#21)', function() {
         publisher = resources.replacePublisherForFeature( scope, 'superFeature.superAttribute', {
            deliverToSender: true
         } );

         publisher( {} );

         expect( scope.eventBus.publish )
            .toHaveBeenCalledWith( 'didReplace.cheese', {
               resource: 'cheese',
               data: {}
            }, {
               deliverToSender: true
            } );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'A didReplace-event publisher configured with options.isOptional', function() {

      var publisher;
      var scope;

      beforeEach( function() {
         scope = {
            eventBus: portalMocks.mockEventBus(),
            features: {}
         };

         publisher = resources.replacePublisherForFeature( scope, 'optionalFeature', { isOptional: true } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'doesn\'t interact with the event bus when called', function() {
         publisher( {} );

         expect( scope.eventBus.publish ).not.toHaveBeenCalled();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'returns an already completed promise when called', function() {
         var resolved = false;
         publisher( {} ).then( function() {
            resolved = true;
         } );
         jasmine.Clock.tick( 0 );

         expect( resolved ).toBe( true );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'A standard didUpdate-event publisher', function() {

      var publisher;
      var scope;

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

      it( 'sends didUpdate events with patches', function() {
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

      it( 'does not publish events for empty lists of patches', function() {
         publisher( [] );
         expect( scope.eventBus.publish ).not.toHaveBeenCalled();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'returns a promise when called (#17)', function() {
         var promise = publisher( [ { op: 'replace', path: '/hose/0', value: '3cm' } ] );

         expect( typeof promise.then ).toEqual( 'function' );
         expect( typeof publisher( [] ).then ).toEqual( 'function' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'adds a method to the returned function', function() {

         var from;
         var to;
         var patches;
         var promise;

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
            patches = [
               { op: 'replace', path: '/type', value: 'Gouda alt' },
               { op: 'add', path: '/sold', value: true }
            ];

            spyOn( jsonPatch, 'compare' ).andCallThrough();
            promise = publisher.compareAndPublish( from, to );
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

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'that returns a promise when called (#17)', function() {
            expect( typeof promise.then ).toEqual( 'function' );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'forwards the deliverToSender option to the event bus (#21)', function() {
         publisher = resources.updatePublisherForFeature( scope, 'superFeature.superAttribute', {
            deliverToSender: true,
            jsonPatchOnly: true
         } );

         publisher( [ { op: 'replace', path: '/hose/0', value: '3cm' } ] );

         expect( scope.eventBus.publish )
            .toHaveBeenCalledWith( 'didUpdate.cheese', {
               resource: 'cheese',
               patches: [ { op: 'replace', path: '/hose/0', value: '3cm' } ]
            }, {
               deliverToSender: true
            } );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'A didUpdate-event publisher configured with options.isOptional', function() {

      var publisher;
      var scope;

      beforeEach( function() {
         scope = {
            eventBus: portalMocks.mockEventBus(),
            features: {}
         };

         publisher = resources.updatePublisherForFeature( scope, 'optionalFeature', { isOptional: true } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'doesn\'t interact with the event bus when called', function() {
         publisher( {} );

         expect( scope.eventBus.publish ).not.toHaveBeenCalled();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'returns an already completed promise when called', function() {
         var resolved = false;
         publisher( {} ).then( function() {
            resolved = true;
         } );
         jasmine.Clock.tick( 0 );

         expect( resolved ).toBe( true );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'adds a compareAndPublish method', function() {
         expect( typeof publisher.compareAndPublish ).toEqual( 'function' );
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
            resources: {}
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
               patches: []
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

         it( 'sets the values as new resources on the scope', function() {
            expect( scope.resources.sausage ).toEqual( sausage );
            expect( scope.resources.superAttribute ).toEqual( cheese );
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
         var patches;

         beforeEach( function() {
            patches = [
               { op: 'replace', path: '/type', value: 'bockwurst' },
               { op: 'replace', path: '/length', value: '15cm' }
            ];

            scope.resources.sausage = {
               diameter: '5cm',
               length: '30cm',
               type: 'salami'
            };
            scope.eventBus.publish( 'didUpdate.sausage', {
               resource: 'sausage',
               patches: patches
            }, {
               sender: 'spec'
            } );
            jasmine.Clock.tick( 0 );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'applies the updates to the resource', function() {
            expect( scope.resources.sausage ).toEqual( {
               diameter: '5cm',
               length: '15cm',
               type: 'bockwurst'
            } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'calls the according handler with the event that occurred', function() {
            expect( onUpdateSausageSpy ).toHaveBeenCalled();
            expect( onUpdateSausageSpy.calls[0].args[0].patches ).toEqual( patches );
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
               scope.eventBus.publish( 'didUpdate.sausage', { resource: 'sausage', patches: [] }, { sender: 'spec' } );
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

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'calls all handlers on replace (jira ATP-7455)', function() {
               expect( cheeseSpyOne ).toHaveBeenCalled();
               expect( cheeseSpyTwo ).toHaveBeenCalled();
            } );

            //////////////////////////////////////////////////////////////////////////////////////////////////

            it( 'calls all handlers on update (jira ATP-7455)', function() {
               cheeseSpyOne.reset();
               cheeseSpyTwo.reset();

               scope.eventBus.publish( 'didUpdate.cheese', { resource: 'cheese', patches: [] }, { sender: 'spec' } );
               jasmine.Clock.tick( 0 );

               expect( cheeseSpyOne ).toHaveBeenCalled();
               expect( cheeseSpyTwo ).toHaveBeenCalled();
            } );

         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'with a watch option for whenAllWereReplaced', function() {

         var watchSpy;

         beforeEach( function() {
            watchSpy = jasmine.createSpy( 'cheeseSpyOne' );
            resourceHandler = resources.handlerFor( scope )
               .registerResourceFromFeature( 'superFeature.superAttribute' )
               .registerResource( 'sausage', { } )
               .whenAllWereReplaced( watchSpy, { watch: true } );

            scope.eventBus.publish( 'didReplace.sausage', { resource: 'sausage', data: {} }, { sender: 'spec' } );
            scope.eventBus.publish( 'didUpdate.sausage', { resource: 'sausage', patches: [
               { op: 'replace', path: '/x', value: 5 }
            ] }, { sender: 'spec' } );
            scope.eventBus.publish( 'didReplace.cheese', { resource: 'cheese', data: {} }, { sender: 'spec' } );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'continues to inform handlers about changes to their resources', function() {
            jasmine.Clock.tick( 0 );
            expect( watchSpy ).toHaveBeenCalled();
            expect( watchSpy.calls.length ).toEqual( 1 );

            scope.eventBus.publish( 'didUpdate.sausage', {
                  resource: 'sausage',
                  patches: [ { op: 'replace', path: '/x', value: 6 } ]
               },
               { sender: 'spec' } );
            jasmine.Clock.tick( 0 );
            expect( watchSpy.calls.length ).toEqual( 2 );
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

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
               { resource: 'sausage', patches: [ { op: 'replace', path: '/newData', value: false } ] },
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

            var patches = [ { op: 'add', path: '/y', value: 13 } ];
            scope.eventBus.publish( 'didUpdate.sausage', { resource: 'sausage', patches: patches }, { sender: 'spec' } );
            scope.eventBus.publish( 'didUpdate.cheese', { resource: 'cheese', patches: patches }, { sender: 'spec' } );
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

            var patches = [ { op: 'add', path: '/y', value: 13 } ];
            scope.eventBus.publish( 'didReplace.cheese', { resource: 'cheese', data: {} }, { sender: 'spec' } );
            scope.eventBus.publish( 'didUpdate.cheese', { resource: 'cheese', patches: patches }, { sender: 'spec' } );
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

   ////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'resource comparison using isSame( resourceA, resourceB, compareAttributes )', function() {

      var compareAttributes;
      var res1;
      var res2;
      var res3;
      var res4;
      var res5;
      var res6;

      beforeEach( function() {
         compareAttributes = [ 'selfLink', 'id' ];
         res1 = {
            selfLink: 'a',
            id: 'a',
            something: 'x',
            sub: { prop: 'A' }
         };
         res2 = {
            selfLink: 'a',
            id: 'a',
            something: 'y',
            sub: { prop: 'A' }
         };
         res3 = {
            selfLink: 'a',
            id: 'b',
            sub: { prop: 'B' }
         };
         res4 = {
            selfLink: 'a',
            sub: {}
         };
         res5 = {
            something: 'y',
            sub: {}
         };
         res6 = {
            something: 'y'
         };
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'returns false if at least one object is null or undefined', function() {
         expect( resources.isSame( res1, null, compareAttributes ) ).toBe( false );
         expect( resources.isSame( null, res1, compareAttributes ) ).toBe( false );
         expect( resources.isSame( null, null, compareAttributes ) ).toBe( false );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'returns true if all tested attribute values are identical', function() {
         expect( resources.isSame( res1, res2, compareAttributes ) ).toBe( true );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'returns false if at least one tested attribute value is not identical', function() {
         expect( resources.isSame( res1, res3, compareAttributes ) ).toBe( false );
         expect( resources.isSame( res2, res3, compareAttributes ) ).toBe( false );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'returns true if only one attribute exists in both resources and both values are identical', function() {
         delete res1.id;
         expect( resources.isSame( res1, res4, compareAttributes ) ).toBe( true );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'returns false if none of the attributes exists in any of the resources', function() {
         expect( resources.isSame( res5, res6, compareAttributes ) ).toBe( false );
      } );

      /////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( ' with equality attribute paths', function() {

         beforeEach( function() {
            compareAttributes = [ 'selfLink', 'sub.prop' ];
         } );

         //////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'returns false if at least one object is null or undefined', function() {
            expect( resources.isSame( res1, null, compareAttributes ) ).toBe( false );
            expect( resources.isSame( null, res1, compareAttributes ) ).toBe( false );
            expect( resources.isSame( null, null, compareAttributes ) ).toBe( false );
         } );

         //////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'returns true if all tested attribute values are identical', function() {
            expect( resources.isSame( res1, res2, compareAttributes ) ).toBe( true );
         } );


         /////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'returns false if at least one tested attribute value is not identical', function() {
            expect( resources.isSame( res1, res3, compareAttributes ) ).toBe( false );
            expect( resources.isSame( res2, res3, compareAttributes ) ).toBe( false );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'returns true if only one attribute exists in both resources and both values are identical', function() {
            delete res1.sub.prop;
            expect( resources.isSame( res1, res4, compareAttributes ) ).toBe( true );
         } );

         //////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'returns false if none of the attributes exists in any of the resources', function() {
            expect( resources.isSame( res5, res6, compareAttributes ) ).toBe( false );
         } );

      } );

   } );

} );
