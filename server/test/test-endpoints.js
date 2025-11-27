// test-endpoints.js
// Script para probar los endpoints de commits y test-runs
// Ejecutar con: node test-endpoints.js

const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3000/api';

// Datos de prueba para commit
const testCommitData = {
  "_id": "a1b2c3d4e5f6789012345678901234567890abcd",
  "branch": "feature/test-implementation",
  "author": "Test Student",
  "commit": {
    "date": new Date().toISOString(),
    "message": "test: add endpoint validation",
    "url": "https://github.com/test-user/TDDLabBaseProject/commit/a1b2c3d4e5"
  },
  "stats": {
    "additions": 45,
    "deletions": 12,
    "total": 57,
    "date": new Date().toISOString().split('T')[0]
  },
  "coverage": 87.5,
  "test_count": 12,
  "failed_tests": 0,
  "conclusion": "success",
  "user_id": "test_student_123",
  "repo_name": "TDDLabTestProject"
};

// Datos de prueba para test-runs
const testRunsData = {
  "commit_sha": "a1b2c3d4e5f6789012345678901234567890abcd",
  "branch": "feature/test-implementation",
  "user_id": "test_student_123",
  "repo_name": "TDDLabTestProject",
  "runs": [
    {
      "execution_timestamp": Date.now() - 5000,
      "summary": {
        "passed": 10,
        "failed": 0,
        "total": 10
      },
      "success": true,
      "test_id": 1
    },
    {
      "execution_timestamp": Date.now() - 2000,
      "summary": {
        "passed": 12,
        "failed": 0,
        "total": 12
      },
      "success": true,
      "test_id": 2
    },
    {
      "execution_timestamp": Date.now(),
      "summary": {
        "passed": 12,
        "failed": 0,
        "total": 12
      },
      "success": true,
      "test_id": 3
    }
  ]
};

// Función para probar el endpoint de commits
async function testCommitEndpoint() {
  console.log('\n🧪 Testing POST /commits endpoint...');
  console.log('─'.repeat(50));
  
  try {
    const response = await axios.post(`${BASE_URL}/commits`, testCommitData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Error!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
    return false;
  }
}

// Función para probar el endpoint de test-runs
async function testTestRunsEndpoint() {
  console.log('\n🧪 Testing POST /test-runs endpoint...');
  console.log('─'.repeat(50));
  
  try {
    const response = await axios.post(`${BASE_URL}/test-runs`, testRunsData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ Error!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
    return false;
  }
}

// Función para probar validaciones (datos incorrectos)
async function testValidations() {
  console.log('\n🧪 Testing validations with invalid data...');
  console.log('─'.repeat(50));
  
  const invalidCommit = {
    "_id": "invalid",  // SHA inválido
    "branch": "test"
    // Faltan campos requeridos
  };
  
  try {
    await axios.post(`${BASE_URL}/commits`, invalidCommit);
    console.log('❌ Validation test failed - should have rejected invalid data');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Validation working correctly!');
      console.log('Error message:', error.response.data.message);
      return true;
    } else {
      console.log('❌ Unexpected error');
      console.log('Error:', error.message);
      return false;
    }
  }
}

// Función principal
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   TDDLab Endpoints Test Suite                 ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`\nTesting endpoints at: ${BASE_URL}`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);
  
  let results = {
    commit: false,
    testRuns: false,
    validation: false
  };
  
  // Ejecutar tests
  results.commit = await testCommitEndpoint();
  await sleep(1000); // Esperar 1 segundo entre tests
  
  results.testRuns = await testTestRunsEndpoint();
  await sleep(1000);
  
  results.validation = await testValidations();
  
  // Mostrar resumen
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   Test Results Summary                        ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  console.log(`POST /commits:      ${results.commit ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`POST /test-runs:    ${results.testRuns ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Validations:        ${results.validation ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = results.commit && results.testRuns && results.validation;
  
  console.log('\n' + '─'.repeat(50));
  if (allPassed) {
    console.log('🎉 All tests passed! Endpoints are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above.');
  }
  console.log('─'.repeat(50) + '\n');
  
  process.exit(allPassed ? 0 : 1);
}

// Utilidad para esperar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Ejecutar tests
runTests().catch(error => {
  console.error('❌ Fatal error running tests:', error);
  process.exit(1);
});