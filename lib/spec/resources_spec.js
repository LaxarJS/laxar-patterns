/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import jsonPatch from 'fast-json-patch';
import { create as createEventBusMock } from 'laxar/lib/testing/event_bus_mock';
import { create as createLogMock } from 'laxar/lib/testing/log_mock';
import * as resources from '../resources';

const sender = 'spec';

let myTestModel;

beforeEach( () => {
   myTestModel = {
      someValue: 'anyValue',
      someNaturalNumbers: [ { number: 1 } ],
      someGermanEnglishDictionary: {
         sausage: 'Wurst',
         beer: 'Bier'
      }
   };
} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'A standard didReplace-event handler', () => {

   let handler;
   let context;

   beforeEach( () => {
      context = {
         eventBus: createEventBusMock(),
         resources: {
            myTestModel: null
         }
      };

      handler = resources.replaceHandler( context, 'myTestModel' );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'returns true for non-empty replaces', () => {
      expect( handler( { data: myTestModel } ) ).toBe( true );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'returns false for empty, idempotent replaces', () => {
      expect( handler( { data: null } ) ).toBe( false );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'sets the resource received from a didReplace event into context.resources[ modelKey ]', () => {
      handler( { data: myTestModel } );

      expect( context.resources.myTestModel ).toEqual( myTestModel );
   } );

} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'A standard didUpdate-event handler', () => {

   let handler;
   let handlerEmptyModel;
   let context;

   beforeEach( () => {
      context = {
         eventBus: createEventBusMock(),
         resources: {
            myTestModel: {
               someValue: 'anyValue',
               someNaturalNumbers: [ { number: 1 } ]
            },
            primitive: true
         }
      };

      handler = resources.updateHandler( context, 'myTestModel' );
      handlerEmptyModel = resources.updateHandler( context, 'myTestModelEmpty' );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'returns true for non-empty updates', () => {
      expect( handler( { patches: [ { op: 'add', path: '/someKey', value: 12 } ] } ) ).toBe( true );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'returns false for empty, idempotent empty updates', () => {
      expect( handlerEmptyModel( {} ) ).toBe( false );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when patches is given', () => {

      let patches;
      let expected;

      beforeEach( () => {
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

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'uses jsonpatch to apply them to the model', () => {
         handler( { patches } );

         expect( context.resources.myTestModel ).toEqual( expected );
      } );

   } );

} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'A standard didReplace-event publisher', () => {

   let publisher;
   let context;

   beforeEach( () => {
      context = {
         eventBus: createEventBusMock(),
         features: {
            superFeature: {
               superAttribute: {
                  resource: 'cheese'
               }
            }
         }
      };

      publisher = resources.replacePublisherForFeature( context, 'superFeature.superAttribute' );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'creates a function to send didReplace events', () => {
      publisher( {
         type: 'Gouda jung',
         country: 'netherlands'
      } );

      expect( context.eventBus.publish )
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

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'returns a promise when called (#17)', () => {
      const promise = publisher( {
         type: 'Gouda jung',
         country: 'netherlands'
      } );

      expect( typeof promise.then ).toEqual( 'function' );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'forwards the deliverToSender option to the event bus (#21)', () => {
      publisher = resources.replacePublisherForFeature( context, 'superFeature.superAttribute', {
         deliverToSender: true
      } );

      publisher( {} );

      expect( context.eventBus.publish )
         .toHaveBeenCalledWith( 'didReplace.cheese', {
            resource: 'cheese',
            data: {}
         }, {
            deliverToSender: true
         } );
   } );

} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'A didReplace-event publisher configured with options.isOptional', () => {

   let publisher;
   let context;

   beforeEach( () => {
      context = {
         eventBus: createEventBusMock(),
         features: {}
      };

      publisher = resources.replacePublisherForFeature( context, 'optionalFeature', { isOptional: true } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'doesn\'t interact with the event bus when called', () => {
      publisher( {} );

      expect( context.eventBus.publish ).not.toHaveBeenCalled();
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'returns an already completed promise when called', done => {
      publisher( {} )
         .then( () => expect( true ).toBe( true ) )
         .then( done, done.fail );
   } );

} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'A standard didUpdate-event publisher', () => {

   let publisher;
   let context;

   beforeEach( () => {
      context = {
         eventBus: createEventBusMock(),
         log: createLogMock(),
         features: {
            superFeature: {
               superAttribute: {
                  resource: 'cheese'
               }
            }
         }
      };

      publisher = resources.updatePublisherForFeature( context, 'superFeature.superAttribute' );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'sends didUpdate events with patches', () => {
      publisher( [ { op: 'replace', path: '/hose/0', value: '3cm' } ] );

      expect( context.eventBus.publish )
         .toHaveBeenCalledWith( 'didUpdate.cheese', {
            resource: 'cheese',
            patches: [ { op: 'replace', path: '/hose/0', value: '3cm' } ]
         }, {
            deliverToSender: false
         } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'does not publish events for empty lists of patches', () => {
      publisher( [] );
      expect( context.eventBus.publish ).not.toHaveBeenCalled();
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'returns a promise when called (#17)', () => {
      const promise = publisher( [ { op: 'replace', path: '/hose/0', value: '3cm' } ] );

      expect( typeof promise.then ).toEqual( 'function' );
      expect( typeof publisher( [] ).then ).toEqual( 'function' );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'adds a method to the returned function', () => {

      let from;
      let to;
      let patches;
      let promise;

      beforeEach( () => {
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

         spyOn( jsonPatch, 'compare' ).and.callThrough();
         promise = publisher.compareAndPublish( from, to );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'that creates patches using json patch', () => {
         expect( jsonPatch.compare ).toHaveBeenCalledWith( from, to );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'that directly publishes a didUpdate event using the patches', () => {
         expect( context.eventBus.publish )
            .toHaveBeenCalledWith( 'didUpdate.cheese', {
               resource: 'cheese',
               patches
            }, {
               deliverToSender: false
            } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'that returns a promise when called (#17)', () => {
         expect( typeof promise.then ).toEqual( 'function' );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'forwards the deliverToSender option to the event bus (#21)', () => {
      publisher = resources.updatePublisherForFeature( context, 'superFeature.superAttribute', {
         deliverToSender: true,
         jsonPatchOnly: true
      } );

      publisher( [ { op: 'replace', path: '/hose/0', value: '3cm' } ] );

      expect( context.eventBus.publish )
         .toHaveBeenCalledWith( 'didUpdate.cheese', {
            resource: 'cheese',
            patches: [ { op: 'replace', path: '/hose/0', value: '3cm' } ]
         }, {
            deliverToSender: true
         } );
   } );

} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'A didUpdate-event publisher configured with options.isOptional', () => {

   let publisher;
   let context;

   beforeEach( () => {
      context = {
         eventBus: createEventBusMock(),
         features: {}
      };

      publisher = resources.updatePublisherForFeature( context, 'optionalFeature', { isOptional: true } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'doesn\'t interact with the event bus when called', () => {
      publisher( {} );

      expect( context.eventBus.publish ).not.toHaveBeenCalled();
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'returns an already completed promise when called', done => {
      publisher( {} )
         .then( () => expect( true ).toBe( true ) )
         .then( done, done.fail );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'adds a compareAndPublish method', () => {
      expect( typeof publisher.compareAndPublish ).toEqual( 'function' );
   } );

} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'A ResourceHandler', () => {

   let context;
   let featureOptions;
   let resourceHandler;
   let onReplaceSausageSpy;
   let onUpdateSausageSpy;
   let onReplaceCheeseSpy;
   let onUpdateCheeseSpy;
   let onAllReplacedSpy;

   beforeEach( () => {
      context = {
         eventBus: createEventBusMock( { nextTick: _ => Promise.resolve().then( _ ) } ),
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

      resourceHandler = resources.handlerFor( context )
         .registerResourceFromFeature( 'superFeature.superAttribute', featureOptions )
         .registerResource( 'sausage', {
            onReplace: onReplaceSausageSpy,
            onUpdate: onUpdateSausageSpy
         } )
         .whenAllWereReplaced( onAllReplacedSpy );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'does not create subscriptions for missing optional resources', () => {
      expect( () => {
         resourceHandler.registerResourceFromFeature( 'completelyMissingOptional', {
            isOptional: true,
            onUpdateReplace: () => {}
         } );
      } ).not.toThrow();

      expect( () => {
         resourceHandler.registerResourceFromFeature( 'missingOptional', {
            isOptional: true,
            onUpdate: () => {}
         } );
      } ).not.toThrow();

      expect( context.eventBus.subscribe ).not.toHaveBeenCalledWith(
         'didReplace.missingOptional', jasmine.any( Function )
      );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'subscribes to didReplace events of the given features', () => {
      expect( context.eventBus.subscribe )
         .toHaveBeenCalledWith( 'didReplace.cheese', jasmine.any( Function ) );
      expect( context.eventBus.subscribe )
         .toHaveBeenCalledWith( 'didReplace.sausage', jasmine.any( Function ) );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'subscribes to didUpdate events of the given features', () => {
      expect( context.eventBus.subscribe )
         .toHaveBeenCalledWith( 'didUpdate.cheese', jasmine.any( Function ) );
      expect( context.eventBus.subscribe )
         .toHaveBeenCalledWith( 'didUpdate.sausage', jasmine.any( Function ) );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'does not modify the options object passed to the register function (i.e. makes a copy)', () => {
      expect( featureOptions ).toEqual( {
         onReplace: onReplaceCheeseSpy,
         onUpdate: onUpdateCheeseSpy,
         omitFirstReplace: true
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when an empty didReplace event is published', () => {

      beforeEach( done => {
         context.eventBus.publish( 'didReplace.sausage', {
            data: null
         }, {
            sender
         } )
         .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'the replacement observers will not be called', () => {
         expect( onReplaceSausageSpy ).not.toHaveBeenCalled();
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when an empty didUpdate event is published', () => {

      beforeEach( done => {
         context.eventBus.publish( 'didUpdate.sausage', {
            patches: []
         }, {
            sender
         } )
         .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'the update observers will not be called', () => {
         expect( onUpdateSausageSpy ).not.toHaveBeenCalled();
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when a didReplace event is published', () => {

      let sausage;
      let cheese;

      beforeEach( done => {
         sausage = {
            diameter: '5cm',
            length: '30cm',
            type: 'salami'
         };
         cheese = {
            smelliness: 'high',
            softness: 'medium'
         };
         Promise.all( [
            context.eventBus.publish( 'didReplace.sausage', {
               resource: 'sausage',
               data: sausage
            }, {
               sender
            } ),
            context.eventBus.publish( 'didReplace.cheese', {
               resource: 'cheese',
               data: cheese
            }, {
               sender
            } )
         ] )
         .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'sets the values as new resources on the context', () => {
         expect( context.resources.sausage ).toEqual( sausage );
         expect( context.resources.superAttribute ).toEqual( cheese );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'calls the corresponding handler with the event that occurred', () => {
         expect( onReplaceSausageSpy ).toHaveBeenCalled();
         expect( onReplaceSausageSpy.calls.argsFor( 0 )[ 0 ].data ).toEqual( {
            diameter: '5cm',
            length: '30cm',
            type: 'salami'
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'passes event meta data to the corresponding handler', () => {
         expect( onReplaceSausageSpy ).toHaveBeenCalledWith( jasmine.any( Object ), jasmine.any( Object ) );
         const [ , meta ] = onReplaceSausageSpy.calls.argsFor( 0 );
         expect( meta.name ).toEqual( 'didReplace.sausage' );
         expect( meta.sender ).toEqual( 'spec' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'doesn\'t call the handler instantly if omitFirstReplace is true', done => {
         expect( onReplaceCheeseSpy ).not.toHaveBeenCalled();

         context.eventBus.publish( 'didReplace.cheese', {
            data: cheese
         }, {
            sender
         } )
         .then( () => expect( onReplaceCheeseSpy ).toHaveBeenCalled() )
         .then( done, done.fail );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when a didUpdate event is published', () => {

      let patches;

      beforeEach( done => {
         patches = [
            { op: 'replace', path: '/type', value: 'bockwurst' },
            { op: 'replace', path: '/length', value: '15cm' }
         ];

         Promise.all( [
            context.resources.sausage = {
               diameter: '5cm',
               length: '30cm',
               type: 'salami'
            },
            context.eventBus.publish( 'didUpdate.sausage', { resource: 'sausage', patches }, { sender } )
         ] )
         .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'applies the updates to the resource', () => {
         expect( context.resources.sausage ).toEqual( {
            diameter: '5cm',
            length: '15cm',
            type: 'bockwurst'
         } );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'calls the corresponding handler with the event that occurred', () => {
         expect( onUpdateSausageSpy ).toHaveBeenCalled();
         expect( onUpdateSausageSpy.calls.argsFor( 0 )[ 0 ].patches ).toEqual( patches );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'passes event meta data to the corresponding handler', () => {
         expect( onUpdateSausageSpy ).toHaveBeenCalledWith( jasmine.any( Object ), jasmine.any( Object ) );
         const [ , meta ] = onUpdateSausageSpy.calls.argsFor( 0 );
         expect( meta.name ).toEqual( 'didUpdate.sausage' );
         expect( meta.sender ).toEqual( 'spec' );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when multiple handlers for the same resource are registered', () => {

      describe( 'by different collaborators', () => {

         let anotherSausageSpy;

         beforeEach( done => {
            anotherSausageSpy = jasmine.createSpy( 'anotherSausageSpy' );
            resourceHandler.registerResource( 'sausage', {
               onReplace: anotherSausageSpy,
               onUpdate: anotherSausageSpy
            } );

            Promise.all( [
               context.eventBus
                  .publish( 'didReplace.sausage', { resource: 'sausage', data: {} }, { sender } ),
               context.eventBus
                  .publish( 'didUpdate.sausage', { resource: 'sausage', patches: [] }, { sender } )
            ] )
            .then( done, done.fail );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'calls all of the handlers for the same resource on replace', () => {
            expect( onReplaceSausageSpy ).toHaveBeenCalled();
            expect( anotherSausageSpy ).toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'calls all of the handlers for the same resource on update', () => {
            expect( onUpdateSausageSpy ).toHaveBeenCalled();
            expect( anotherSausageSpy ).toHaveBeenCalled();
         } );

      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      describe( 'using an array of handler functions', () => {

         let cheeseSpyOne;
         let cheeseSpyTwo;

         beforeEach( done => {
            cheeseSpyOne = jasmine.createSpy( 'cheeseSpyOne' );
            cheeseSpyTwo = jasmine.createSpy( 'cheeseSpyTwo' );
            resourceHandler.registerResource( 'cheese', {
               onReplace: [ cheeseSpyOne, cheeseSpyTwo ],
               onUpdate: [ cheeseSpyOne, cheeseSpyTwo ]
            } );

            context.eventBus
               .publish( 'didReplace.cheese', { resource: 'cheese', data: {} }, { sender } )
               .then( done, done.fail );
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'calls all handlers on replace', () => {
            expect( cheeseSpyOne ).toHaveBeenCalled();
            expect( cheeseSpyTwo ).toHaveBeenCalled();
         } );

         /////////////////////////////////////////////////////////////////////////////////////////////////////

         it( 'calls all handlers on update', done => {
            cheeseSpyOne.calls.reset();
            cheeseSpyTwo.calls.reset();

            context.eventBus.publish( 'didUpdate.cheese', { resource: 'cheese', patches: [] }, { sender } )
               .then( () => {
                  expect( cheeseSpyOne ).toHaveBeenCalled();
                  expect( cheeseSpyTwo ).toHaveBeenCalled();
               } )
               .then( done, done.fail );
         } );

      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a watch option for whenAllWereReplaced', () => {

      let watchSpy;

      beforeEach( done => {
         watchSpy = jasmine.createSpy( 'cheeseSpyOne' );
         resourceHandler = resources.handlerFor( context )
            .registerResourceFromFeature( 'superFeature.superAttribute' )
            .registerResource( 'sausage', { } )
            .whenAllWereReplaced( watchSpy, { watch: true } );

         Promise.all( [
            context.eventBus
               .publish( 'didReplace.sausage', { resource: 'sausage', data: {} }, { sender } ),
            context.eventBus
               .publish( 'didUpdate.sausage', {
                  resource: 'sausage',
                  patches: [ { op: 'replace', path: '/x', value: 5 } ]
               }, { sender } ),
            context.eventBus
               .publish( 'didReplace.cheese', { resource: 'cheese', data: {} }, { sender } )
         ] )
         .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'continues to inform handlers about changes to their resources', done => {
         expect( watchSpy ).toHaveBeenCalled();
         expect( watchSpy.calls.count() ).toEqual( 1 );

         context.eventBus.publish( 'didUpdate.sausage', {
            resource: 'sausage',
            patches: [ { op: 'replace', path: '/x', value: 6 } ]
         }, {
            sender
         } )
         .then( () => {
            expect( watchSpy.calls.count() ).toEqual( 2 );
         } )
         .then( done, done.fail );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'without a watch option for whenAllWereReplaced', () => {

      let watchSpy;

      beforeEach( done => {
         watchSpy = jasmine.createSpy( 'cheeseSpyOne' );
         resourceHandler = resources.handlerFor( context )
            .registerResourceFromFeature( 'superFeature.superAttribute' )
            .registerResource( 'sausage', { } )
            .whenAllWereReplaced( watchSpy );

         Promise.all( [
            context.eventBus.publish( 'didReplace.sausage', { resource: 'sausage', data: {} }, { sender } ),
            context.eventBus.publish( 'didReplace.cheese', { resource: 'cheese', data: {} }, { sender } )
         ] )
         .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'does not continue to inform handlers about changes to their resources', done => {
         expect( watchSpy ).toHaveBeenCalled();
         expect( watchSpy.calls.count() ).toEqual( 1 );

         context.eventBus.publish(
            'didReplace.sausage',
            { resource: 'sausage', data: { newData: true } },
            { sender }
         )
         .then( () => {
            expect( watchSpy.calls.count() ).toEqual( 1 );
         } )
         .then( () => {
            return context.eventBus.publish(
               'didUpdate.sausage',
               { resource: 'sausage', patches: [ { op: 'replace', path: '/newData', value: false } ] },
               { sender }
            );
         } )
         .then( () => {
            expect( watchSpy.calls.count() ).toEqual( 1 );
         } )
         .then( done, done.fail );
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a method to wait for all initial replaces (whenAllWereReplaced)', () => {

      let cheese;

      beforeEach( done => {
         const sausage = {
            diameter: '5cm',
            length: '30cm',
            type: 'salami'
         };
         cheese = {
            smelliness: 'high',
            softness: 'medium'
         };
         context.eventBus.publish( 'didReplace.sausage', {
            resource: 'sausage',
            data: sausage
         }, {
            sender
         } )
         .then( done );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'doesn\'t call the callback when not all resources were replaced', () => {
         expect( onAllReplacedSpy ).not.toHaveBeenCalled();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'calls the callback when all resources were replaced', done => {
         context.eventBus.publish( 'didReplace.cheese', {
            resource: 'cheese',
            data: cheese
         }, {
            sender
         } )
         .then( () => expect( onAllReplacedSpy ).toHaveBeenCalled() )
         .then( done, done.fail );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with a method to check for receipt of resource (wereAllReplaced)', () => {

      let sausage;
      let cheese;

      beforeEach( () => {
         sausage = { type: 'salami' };
         cheese = { smelliness: 'high' };
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'tells when not all resources have been replaced', done => {
         expect( resourceHandler.wereAllReplaced() ).toBe( false );

         context.eventBus.publish( 'didReplace.sausage', {
            resource: 'sausage',
            data: sausage
         }, { sender } )
         .then( () => expect( resourceHandler.wereAllReplaced() ).toBe( false ) )
         .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'tells when all resources have been replaced', done => {
         Promise.all( [
            context.eventBus.publish( 'didReplace.cheese', {
               resource: 'cheese',
               data: cheese
            }, { sender } ),
            context.eventBus.publish( 'didReplace.sausage', {
               resource: 'sausage',
               data: sausage
            }, { sender } )
         ] )
         .then( () => expect( resourceHandler.wereAllReplaced() ).toBe( true ) )
         .then( done, done.fail );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'combined as onUpdateReplace handlers', () => {

      let sausageSpy;
      let cheeseSpyOne;
      let cheeseSpyTwo;

      beforeEach( done => {
         sausageSpy = jasmine.createSpy( 'sausageSpy' );
         cheeseSpyOne = jasmine.createSpy( 'cheeseSpyOne' );
         cheeseSpyTwo = jasmine.createSpy( 'cheeseSpyTwo' );
         // shorthand syntax
         resourceHandler.registerResource( 'sausage', sausageSpy );
         // longer syntax with multiple arguments
         resourceHandler.registerResource( 'cheese', {
            onUpdateReplace: [ cheeseSpyOne, cheeseSpyTwo ]
         } );

         Promise.all( [
            context.eventBus.publish( 'didReplace.sausage', { resource: 'sausage', data: {} }, { sender } ),
            context.eventBus.publish( 'didReplace.cheese', { resource: 'cheese', data: {} }, { sender } )
         ] )
         .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'calls single and multiple handlers on replace', () => {
         expect( sausageSpy ).toHaveBeenCalled();
         expect( cheeseSpyOne ).toHaveBeenCalled();
         expect( cheeseSpyTwo ).toHaveBeenCalled();
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'calls single and multiple handlers on update', done => {
         sausageSpy.calls.reset();
         cheeseSpyOne.calls.reset();
         cheeseSpyTwo.calls.reset();

         const patches = [ { op: 'add', path: '/y', value: 13 } ];
         Promise.all( [
            context.eventBus
               .publish( 'didUpdate.sausage', { resource: 'sausage', patches }, { sender } ),
            context.eventBus
               .publish( 'didUpdate.cheese', { resource: 'cheese', patches }, { sender } )
         ] )
         .then( () => {
            expect( sausageSpy ).toHaveBeenCalled();
            expect( cheeseSpyOne ).toHaveBeenCalled();
            expect( cheeseSpyTwo ).toHaveBeenCalled();
         } )
         .then( done, done.fail );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'when the same resource is registered from different features', () => {

      function numberOfSubscribes( eventName ) {
         return context.eventBus.subscribe.calls.all()
            .filter( call => call.args[ 0 ] === eventName ).length;
      }

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      beforeEach( done => {
         context = {
            eventBus: createEventBusMock( { nextTick: _ => Promise.resolve().then( _ ) } ),
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
         resourceHandler = resources.handlerFor( context )
            .registerResourceFromFeature( 'superFeature.superAttribute', featureOptions )
            .registerResourceFromFeature( 'superFeature.superAttributeTwo', featureOptions );

         const patches = [ { op: 'add', path: '/y', value: 13 } ];
         Promise.all( [
            context.eventBus.publish( 'didReplace.cheese', { resource: 'cheese', data: {} }, { sender } ),
            context.eventBus.publish( 'didUpdate.cheese', { resource: 'cheese', patches }, { sender } )
         ] )
         .then( done, done.fail );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'a subscription to didReplace takes place only once', () => {
         expect( numberOfSubscribes( 'didReplace.cheese' ) ).toBe( 1 );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'a subscription to didUpdate takes place only once', () => {
         expect( numberOfSubscribes( 'didUpdate.cheese' ) ).toBe( 1 );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'only calls the according replace handler for the times it was registered', () => {
         expect( onReplaceCheeseSpy.calls.count() ).toBe( 2 );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'only calls the according update handler for the times it was registered', () => {
         expect( onUpdateCheeseSpy.calls.count() ).toBe( 2 );
      } );

   } );

} );
