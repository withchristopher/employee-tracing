// get the client
const mysql = require('mysql2');
// const ctable
const cTable = require('console.table');
// use node.js file structure module
const fs = require('fs');
// require('dotenv').config();
const express = require('express');
// use inquirer npm package
const inquirer = require('inquirer');

// declare variables, arrays and objects
var rolesArray = [];
var deptArray = [];
var empArray = [];
var manArray = [];
var empArray2 = [];
var rolesArray2 = [];
var roleVar;
var empObj = new Object();
var roleObj = new Object();
var deptObj = new Object();

// create the connection to database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    port: 3306,
    password: 'mysql',
    database: 'company'
});

// create variables for selecting from database 
const rolesAll = `SELECT * FROM roles`;
const deptAll = `SELECT * FROM department`;
const empAll = `SELECT * FROM employee`;

// update objects and arrays when there is a change to the db
var updateObjAndArrays = function() {

    // roles query
    db.query(
        rolesAll,
        function(err, results, fields) {
            rolesArray = [];
            roleVar = "";
            roleObj = [];
            rolesArray2 = [];
            for (let i = 0; i < results.length; i++) {
                rolesArray[results[i].id - 1] = results[i].title;
                roleVar = results[i].title;
                // roles object to map role name to id
                roleObj[roleVar] = results[i].id;
            }
            // add none option to roles array for use in inquirer
            rolesArray2 = rolesArray.push('None');
        }
    )

    // department query
    db.query(
        deptAll,
        function(err, results, fields) {
            deptArray = [];
            deptObj = [];
            console.log("hello");
            for (let i = 0; i < results.length; i++) {
                deptArray.push(results[i].dept_name)
                    // dept object to map dept name to id
                deptObj[results[i].dept_name] = results[i].id;
            }
        }
    )

    // employee query
    db.query(
        empAll,
        function(err, results, fields) {
            empArray = [];
            empObj = [];
            for (let i = 0; i < results.length; i++) {
                var firstName = results[i].first_name;
                var lastName = results[i].last_name;
                var fullName = firstName.concat(' ', lastName);
                empArray[results[i].id - 1] = fullName;
                // employee object to may employee name to id
                empObj[fullName] = results[i].id;
            }
            empArray2 = empArray.push('None');
        }
    )

    // below not currently used but may be in future for possible use for managers
    // const empAll = `SELECT * FROM employee`;
    db.query(
        empAll,
        function(err, results, fields) {
            for (let i = 0; i < results.length; i++) {
                // console.log(results[results[i].manager_id].first_name)
                var innerIndex = results[i].manager_id;
                if (innerIndex != null) {
                    innerIndex = innerIndex + 1;
                    var firstName = results[innerIndex].first_name;
                    var lastName = results[innerIndex].last_name;
                    var fullName = firstName.concat(' ', lastName);

                    manArray.push(fullName);
                }
                // console.log(manArray);
                // console.table(results);

            }
        })
}

updateObjAndArrays();

var startPage = function() {

    const rolesData = `SELECT roles.id, roles.title, roles.salary, dept_name FROM roles LEFT JOIN department on roles.department_id = department.id`;
    const employeeData = `SELECT * FROM employee`;
    const departmentData = `SELECT * FROM department`;
    const viewAllDept = `select e.id, e.first_name, e.last_name, roles.title, department.dept_name, roles.salary, concat( emp_manager.first_name, ' ', emp_manager.last_name) 
      AS manager FROM employee e
      LEFT JOIN employee emp_manager ON e.manager_id = emp_manager.id 
      LEFT JOIN roles ON e.role_id = roles.id LEFT JOIN department ON roles.department_id = department.id ;`;
    return inquirer.prompt([{
            type: 'list',
            name: 'build',
            message: "Which would you like to do: (Choose one)",
            choices: ['View all departments', 'View all roles', 'View all employees', 'Add a department', 'Add a role', 'Add an employee', 'Update an employee role', 'Exit']
        },

    ]).then(answers => {
        console.log(answers.build);
        if (answers.build === 'View all employees') {
            db.query(
                viewAllDept,
                function(err, results, fields) {
                    console.table(results);
                    startPage();
                }
            )
        } else if (answers.build === 'View all departments') {
            db.query(
                departmentData,
                function(err, results, fields) {
                    console.table(results);
                    startPage();
                }
            )
        } else if (answers.build === 'View all roles') {
            db.query(
                rolesData,
                function(err, results, fields) {
                    console.table(results);

                    updateObjAndArrays();
                    startPage();
                }
            )
        } else if (answers.build === 'Exit') {
            endApp();
        } else if (answers.build === 'Add a department') {
            return inquirer.prompt([{
                type: 'input',
                name: 'department_name_new',
                message: "What is the new department name?",
                validate: nameInput => {
                    if (nameInput) {
                        return true;
                    } else {
                        console.log('Please enter name!');
                        return false;
                    }
                }
            }, ]).then(answers => {

                db.query(
                    `INSERT INTO department (dept_name) VALUES (?)`, [answers.department_name_new],
                    function(err, results) {
                        updateObjAndArrays();
                        startPage();
                    }
                )
            })

        } else if (answers.build === 'Add a role') {
            return inquirer.prompt([{
                    type: 'input',
                    name: 'role_name_new',
                    message: "What is the new role name?",
                    validate: nameInput => {
                        if (nameInput) {
                            return true;
                        } else {
                            console.log('Please enter name!');
                            return false;
                        }
                    }
                },
                {
                    type: 'input',
                    name: 'salary_new',
                    message: "What is the salary?",
                    validate: nameInput => {
                        if (nameInput) {
                            return true;
                        } else {
                            console.log('Please enter salary!');
                            return false;
                        }
                    }
                },
                {
                    type: 'list',
                    name: 'dept_new',
                    message: "What is the new dept id?",
                    choices: deptArray,
                },
            ]).then(answers => {
                var deptId = deptObj[answers.dept_new];
                db.query(
                    `INSERT INTO roles (title, salary, department_id) VALUES (?,?,?)`, [answers.role_name_new, answers.salary_new, deptId],
                    function(err, results) {
                        updateObjAndArrays();
                        startPage();
                    }
                )
            })


        } else if (answers.build === 'Add an employee') {
            return inquirer.prompt([{
                    type: 'input',
                    name: 'first_name',
                    message: "What is the employee's first name?",
                    validate: nameInput => {
                        if (nameInput) {
                            return true;
                        } else {
                            console.log('Please enter first name!');
                            return false;
                        }
                    }
                },
                {
                    type: 'input',
                    name: 'last_name',
                    message: "What is the employee's last name?",
                    validate: nameInput => {
                        if (nameInput) {
                            return true;
                        } else {
                            console.log('Please enter last name!');
                            return false;
                        }
                    }
                },
                {
                    type: 'list',
                    name: 'employee_role',
                    message: "What is the employee's role?",
                    choices: rolesArray
                },
                {
                    type: 'list',
                    name: 'employee_manager',
                    message: "Who is the employee's manager?",
                    choices: empArray
                },

            ]).then(answers => {
                if (answers.employee_manager === null) {
                    var empMan = null;
                } else {
                    empMan = empObj[answers.employee_manager];
                }

                var roleVar = roleObj[answers.employee_role];
                console.log("role var is : " + roleVar);
                db.query(
                    `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?,?,?,?)`, [answers.first_name, answers.last_name, roleVar, empMan],

                )
                updateObjAndArrays();
                startPage();

            })
        } else if (answers.build === 'Update an employee role') {
            return inquirer.prompt([{
                type: 'list',
                name: 'employee_name',
                message: "Which employee to update?",
                choices: empArray,


            }, ]).then(answers => {

                var empId = empObj[answers.employee_name];
                return inquirer.prompt([{
                        type: 'input',
                        name: 'first_name',
                        message: "What is the employee's first name?",
                        validate: nameInput => {
                            if (nameInput) {
                                return true;
                            } else {
                                console.log('Please enter first name!');
                                return false;
                            }
                        }
                    },

                    {
                        type: 'input',
                        name: 'last_name',
                        message: "What is the employee's last name?",
                        validate: nameInput => {
                            if (nameInput) {
                                return true;
                            } else {
                                console.log('Please enter last name!');
                                return false;
                            }
                        }
                    },
                    {
                        type: 'list',
                        name: 'employee_role',
                        message: "What is the employee's role?",
                        choices: rolesArray
                    },
                    {
                        type: 'list',
                        name: 'employee_manager',
                        message: "Who is the employee's manager?",
                        choices: empArray
                    },

                ]).then(answers => {

                    if (answers.employee_manager === null) {
                        var empMan = null;
                    } else {
                        empMan = empObj[answers.employee_manager];
                    }

                    var roleVar = roleObj[answers.employee_role];
                    db.query(
                        `UPDATE employee SET first_name = ?, last_name = ?, role_id = ?, manager_id =?  WHERE id = ? `, [answers.first_name, answers.last_name, roleVar, empMan, empId],
                        function(err, results) {
                            updateObjAndArrays();
                            startPage();
                        }
                    )
                })
            })

        }
    })
}

startPage();

var endApp = function() {

}



module.exports = db;