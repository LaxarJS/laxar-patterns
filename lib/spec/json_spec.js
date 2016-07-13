/**
 * Copyright 2016 aixigo AG
 * Released under the MIT license.
 * http://laxarjs.org/license
 */
import * as json from '../json';
import { object } from 'laxar';

describe( 'An json helper', () => {

   describe( 'with json pointer (rfc-6901) support', () => {

      let document;

      beforeEach( () => {
         // example from the spec, section 5
         document = {
            'foo': [ 'bar', 'baz' ],
            '': 0,
            'a/b': 1,
            'c%d': 2,
            'e^f': 3,
            'g|h': 4,
            'i\\j': 5,
            'k"l': 6,
            ' ': 7,
            'm~n': 8
         };
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'allows to resolve a pointer from an object', () => {
         // results from the spec, section 5
         expect( json.getPointer( document, '' ) ).toEqual( document );
         expect( json.getPointer( document, '/foo' ) ).toEqual( [ 'bar', 'baz' ] );
         expect( json.getPointer( document, '/foo/0' ) ).toEqual( 'bar' );
         expect( json.getPointer( document, '/' ) ).toEqual( 0 );
         expect( json.getPointer( document, '/a~1b' ) ).toEqual( 1 );
         expect( json.getPointer( document, '/c%d' ) ).toEqual( 2 );
         expect( json.getPointer( document, '/e^f' ) ).toEqual( 3 );
         expect( json.getPointer( document, '/g|h' ) ).toEqual( 4 );
         expect( json.getPointer( document, '/i\\j' ) ).toEqual( 5 );
         expect( json.getPointer( document, '/k"l' ) ).toEqual( 6 );
         expect( json.getPointer( document, '/ ' ) ).toEqual( 7 );
         expect( json.getPointer( document, '/m~0n' ) ).toEqual( 8 );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'allows to manipulate an object using a pointer', () => {
         expect( json.setPointer( document, '/', 'A' ) ).toBe( document );
         expect( json.getPointer( document, '/' ) ).toEqual( 'A' );

         expect( json.setPointer( document, '/a~1b', 'B' ) ).toBe( document );
         expect( json.getPointer( document, '/a~1b' ) ).toEqual( 'B' );

         json.setPointer( document, '/foo/0', 'X' );
         expect( json.getPointer( document, '/foo' ) ).toEqual( [ 'X', 'baz' ] );

         json.setPointer( document, '/foo', 'Y' );
         expect( document.foo ).toEqual( 'Y' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'correctly handles an empty segment when manipulating documents', () => {
         const clone = object.deepClone( document );
         clone[ '' ] = 'TEST';
         json.setPointer( document, '/', 'TEST' );
         expect( document ).toEqual( clone );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'allows to convert from an object path to a json pointer', () => {
         expect( json.pathToPointer( '' ) ).toEqual( '' );
         expect( json.pathToPointer( 'a.b.c' ) ).toEqual( '/a/b/c' );
         expect( json.pathToPointer( 'x/y.a/b' ) ).toEqual( '/x~1y/a~1b' );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'allows to convert from a json pointer to a json path', () => {
         expect( json.pointerToPath( '' ) ).toEqual( '' );
         expect( json.pointerToPath( '/a/b/c' ) ).toEqual( 'a.b.c' );
         expect( json.pointerToPath( '/x~1y/a~1b' ) ).toEqual( 'x/y.a/b' );
      } );

   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'with json patch (rfc-6902) support', () => {

      let from;
      let to;
      let patches;

      beforeEach( () => {
         from = { a: [ '17', '18' ], b: [ 'x', 'y' ] };
         to = { a: [ '16', '18' ], b: [ 'x', 'y', 'z' ] };
         patches = [
            { op: 'add', path: '/b/2', value: 'z' },
            { op: 'replace', path: '/a/0', value: '16' }
         ];
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'allows to apply an existing patch sequence', () => {
         json.applyPatch( from, patches );
         expect( from ).toEqual( to );
      } );

      ////////////////////////////////////////////////////////////////////////////////////////////////////////

      it( 'allows to create a patch sequence from existing objects', () => {
         expect( json.createPatch( from, to ) ).toEqual( patches );
      } );

   } );

} );
