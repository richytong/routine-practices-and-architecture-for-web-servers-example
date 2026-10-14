# Routine Practices and Architecture for Web Servers Example

![Node.js CI](https://github.com/richytong/routine-practices-and-architecture-for-web-servers-example/workflows/Node.js%20CI/badge.svg)

To run the code in the example, follow these instructions.

First, clone the repository with `git`. You can use either the ssh or https command.
```sh
# ssh
git clone git@github.com:richytong/routine-practices-and-architecture-for-web-servers-example.git

# https
git clone https://github.com/richytong/routine-practices-and-architecture-for-web-servers-example.git
```

Next, change your directory into the repository you just cloned.
```sh
cd routine-practices-and-architecture-for-web-servers-example
```

Make sure you have Node.js installed. You can install Node.js with [nvm](https://github.com/nvm-sh/nvm). With `nvm`, install Node.js with the following command.
```sh
nvm install 26
nvm alias default 26
```

Now you should have `npm` installed as well. `npm` is the package manager for Node.js. Install the dependencies for the example code with this command.
```sh
npm i
```

Every route of the example code is tested. Check out `test.js` for examples of how to interact with the web server. Run the tests with this command.
```
npm test
```

You can run the server by itself with this command.
```sh
./run
```

## License
The code in this example is freely distributed under the [CFOSS License](https://cloutsworld.com/en-us/legal/license/cfoss).

## Support
 * minimum Node.js version: 16
