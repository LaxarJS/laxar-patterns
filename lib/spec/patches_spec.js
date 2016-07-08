/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import * as patches from '../patches';

describe( 'patches.apply( object, patchMap )', () => {

   let obj;
   let array;

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   beforeEach( () => {
      obj = {
         listOfStrings: [ 'A', 'B', 'C' ],
         level1: {
            value: 'ABC',
            level2: {
               value: 'DEF'
            }
         }
      };
      array = [ 'A', 'B', 'C', 'D', 'E' ];
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'applies a map of patches for existing properties', () => {
      patches.apply( obj, {
         'listOfStrings.1': 'R',
         'level1.value': 'XXX',
         'level1.level2.value': 123
      } );

      expect( obj ).toEqual( {
         listOfStrings: [ 'A', 'R', 'C' ],
         level1: {
            value: 'XXX',
            level2: {
               value: 123
            }
         }
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'adds non existing array elements at the specified position, setting intermediate values to null', () => {
      patches.apply( obj, {
         'listOfStrings.4': 'Y',
         'listOfStrings.7': 'Z'
      } );

      expect( obj.listOfStrings[4] ).toEqual( 'Y' );
      expect( obj.listOfStrings[5] ).toBe( null );
      expect( obj.listOfStrings[6] ).toBe( null );
      expect( obj.listOfStrings[7] ).toEqual( 'Z' );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'adds non existing paths for objects', () => {
      patches.apply( obj, {
         'levelA.levelB.value': 'C'
      } );

      expect( obj.levelA.levelB.value ).toEqual( 'C' );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'adds non existing paths for arrays', () => {
      patches.apply( obj, {
         'lists.0.objects.4.value': 'B'
      } );

      expect( obj.lists.length ).toBe( 1 );
      expect( obj.lists[0].objects.length ).toBe( 5 );
      expect( obj.lists[0].objects[0] ).toBe( null );
      expect( obj.lists[0].objects[1] ).toBe( null );
      expect( obj.lists[0].objects[2] ).toBe( null );
      expect( obj.lists[0].objects[3] ).toBe( null );
      expect( obj.lists[0].objects[4].value ).toEqual( 'B' );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'treats sparse arrays as patch map for all non undefined values', () => {
      const updates = [];
      updates[1] = 'X';
      updates[4] = 'Y';
      patches.apply( array, updates );

      expect( array ).toEqual( [ 'A', 'X', 'C', 'D', 'Y' ] );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'works when there are null values in the base object', () => {
      const obj = { myKey: null };
      const updates = { 'myKey.0': 12 };

      expect( () => { patches.apply( obj, updates ); } ).not.toThrow();
      expect( obj ).toEqual( { myKey: [ 12 ] } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'ensures an order when applying patches', () => {
      const obj = {
         car: {
            doors: [ 'unknown', 'unknown' ]
         }
      };
      const updates = {
         'car.doors.1': 'open',
         'car.doors': [ 'closed', 'closed' ]
      };

      patches.apply( obj, updates );
      expect( obj ).toEqual( {
         car: {
            doors: [ 'closed', 'open' ]
         }
      } );
   } );

} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'patches.create( target, subject )', () => {

   let simple;
   let complex;
   let polluted;

   beforeEach( () => {
      simple = {
         key1: 12,
         key2: 'Hallo',
         key3: true
      };
      complex = {
         listOfStrings: [ 'A', 'B', 'C' ],
         level1: {
            value: 'ABC',
            level2: {
               value: 'DEF'
            }
         }
      };
      polluted = {
         $$ignoreMe: 'I shall not pass',
         'a nested entry': {
            $$hashCode: '# ## #  ###',
            regularProp: 'I will survive'
         }
      };
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'returns null if the first argument is no array or object', () => {
      expect( patches.create( null, {} ) ).toBe( null );
      expect( patches.create( 12, {} ) ).toBe( null );
      expect( patches.create( 'hi', {} ) ).toBe( null );
      expect( patches.create( true, {} ) ).toBe( null );
      expect( patches.create( new Date(), {} ) ).toBe( null );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'returns a copy of the target if both arguments are of different type', () => {
      expect( patches.create( { '1': 1 }, [ 1 ] ) ).toEqual( { '1': 1 } );
      expect( patches.create( [ 1 ], { '1': 1 } ) ).toEqual( [ 1 ] );
      expect( patches.create( simple, null ) ).toEqual( simple );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'returns a patch map for new entries in a single level object', () => {
      expect( patches.create( simple, { key2: 'Hallo' } ) )
         .toEqual( { key1: 12, key3: true } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'returns a patch map for removed entries in a single level object', () => {
      expect( patches.create( { key2: 'Hallo' }, simple ) )
         .toEqual( { key1: null, key3: null } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'returns a patch map for new entries in a multi level object', () => {
      const source = {
         listOfStrings: [ 'A', 'C' ],
         level1: {
            value: 'XXX',
            level2: {}
         }
      };

      expect( patches.create( complex, source ) ).toEqual( {
         'listOfStrings.1': 'B',
         'listOfStrings.2': 'C',
         'level1.value': 'ABC',
         'level1.level2.value': 'DEF'
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'returns a patch map for deleted entries in a multi level object', () => {
      const target = {
         listOfStrings: [ 'A', 'C' ],
         level1: {
            value: 'XXX',
            level2: {}
         }
      };

      expect( patches.create( target, complex ) ).toEqual( {
         'listOfStrings.1': 'C',
         'listOfStrings.2': null,
         'level1.value': 'XXX',
         'level1.level2.value': null
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'can be used in conjunction with applyPatches', () => {
      const source = {
         listOfStrings: [ 'A', 'C' ],
         level1: {
            value: 'XXX',
            level2: {}
         }
      };

      patches.apply( source, patches.create( complex, source ) );
      expect( source ).toEqual( complex );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'works when there are null values in the result object', () => {
      const base = { myKey: [ 12 ] };
      const result = { myKey: null };
      let updates;

      expect( () => { updates = patches.create( result, base ); } ).not.toThrow();
      expect( updates ).toEqual( { 'myKey': null } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'works when there are null values in the base object', () => {
      const base = { myKey: null };
      const result = { myKey: [ 12 ] };
      let updates;

      expect( () => { updates = patches.create( result, base ); } ).not.toThrow();
      expect( updates ).toEqual( { 'myKey': [ 12 ] } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'ignores hidden properties in the object (LaxarJS/laxar_pattens#3)', () => {
      const base = { };
      const result = polluted;
      let updates;

      expect( () => { updates = patches.create( result, base ); } ).not.toThrow();
      expect( updates ).toEqual( { 'a nested entry': { regularProp: 'I will survive' } } );
   } );
} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe( 'patches.merge( first, second )', () => {

   it( 'merges distinct properties', () => {
      const one = {
         'x.a': 12
      };
      const two = {
         y: [ 1, 2, 3 ]
      };

      expect( patches.merge( one, two ) ).toEqual( {
         'x.a': 12,
         y: [ 1, 2, 3 ]
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'removes changes in first overwritten by changes in second', () => {
      const one = {
         'x.a': 12,
         'y.1': 34
      };
      const two = {
         'x.a': 666,
         y: [ 4, 5, 6 ]
      };

      expect( patches.merge( one, two ) ).toEqual( {
         'x.a': 666,
         y: [ 4, 5, 6 ]
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'merges smaller changes of second into more general change of first', () => {
      const one = {
         'x.a': 666,
         y: [ 4, 5, 6 ]
      };
      const two = {
         'x.a': 12,
         'y.1': 34
      };

      expect( patches.merge( one, two ) ).toEqual( {
         'x.a': 12,
         y: [ 4, 34, 6 ]
      } );
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'merges simple object structures were one key is a prefix of another key', () => {
      const first = {
         payment: {
            amount: 10,
            currency: 'EUR'
         },
         startDate: '2014-01-01'
      };
      const second = {
         paymentFrequency: {}
      };

      expect( patches.merge( first, second ) ).toEqual( {
         payment: {
            amount: 10,
            currency: 'EUR'
         },
         startDate: '2014-01-01',
         paymentFrequency: {}
      } );
   } );

} );
