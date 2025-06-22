# Closed Mode Sample Project

This repository demonstrates the concept of running Fluree DB in "closed mode". 

When starting a `fluree/server` instance, you can configure it to run in either Open or Closed Mode.
When in Closed Mode, all messages to Fluree must be cryptographically signed by an identity that is known to the ledger.

This project includes both a `docker-compose.yml` and a startup script `start.sh` that makes set up easy.
Please see the set up instructions in [Getting Started](#getting-started) for more details.

## Features

- Example configuration, startup script, and seed data and policies for running a sample ledger on `fluree/server` in closed mode.
- Example client application that demonstrates how to use the `fluree-client` SDK to sign messages sent to `fluree/server`.

## Prerequisites
1. [Node and NPM](https://nodejs.org/en/download)
2. Docker Desktop ([Mac](https://docs.docker.com/desktop/setup/install/mac-install/), [Windows](https://docs.docker.com/desktop/setup/install/windows-install/), [Linux](https://docs.docker.com/desktop/setup/install/linux/))

## Getting Started

1. Clone the repository:
  ```bash
  git clone https://github.com/fluree/closed-mode-shipping-sample.git
  ```
  ```bash
  cd closed-mode-shipping-sample
  ```

1. Start up `fluree/server`, seed with initial data, and configure to run in Closed Mode.   
   
   ***Note*** - to seed the ledger with the necessary identities and policies as well as the bootstrap application data, it's easier to begin running Fluree in Open Mode. It's absolutely possible to begin in Closed Mode, but then the startup script would need to sign it's initializing transactions, and I considered this beyond the scope of this sample.  Configuration files for both Open and Closed Mode are provided in the `/resources/` directory. 

   a. Run `fluree/server` in Open Mode.  
   Open `docker-compose.yml` and confirm the config file referenced is `"./resources/config-open-mode.jsonld"`  

   b. Run the startup script 
   ```bash
   ./start.sh
   ```
    The startup script will
      - Pull the latest `fluree/server` docker image
      - Run the docker image and wait a few seconds for Fluree DB to intialize
      - Read and transact all of the JSON-LD files in the `SampleData/` directory.  
      This Sample Data includes the Identities and Policies that will protect your data, as well as the sample instance data that the client application will display and interact with.
      - Wait and listen for a termination command from you and then shut down.
      - ***NOTE*** - If you'd like to start with fresh data state, you can run the script with the `--clean` flag to begin by deleting the `data/` directory Fluree uses to store your data. This will trigger the startup script to transact the sample data again. 

   c. Restart `fluree/server` in Closed Mode.
    - In the terminal where your startup script is running, issue the stop command (Ctrl+C or ^C on Mac)
    - Open `docker-compose.yml` and change the configuration file reference to use the Closed Mode config, so your `--config` line should look like:  
      ```
      --config="./resources/config-open-mode.jsonld"
      ```
    - Run the startup script again (take care to NOT use the `--clean` flag)  
    This will run the `fluree/server` image in Closed Mode with the existing `data/` directory, which includes the seed data created in the previous step.


2. Run Client Application  
   a. Install Dependencies  
    ```bash
    npm i
    ```  

   b. Run App
   ```bash
   npm run dev
   ```  

   c. Open Browser and navigate to http://localhost:5173/

## Usage

You should now see the Sample Shipping Dashboard that is backed by your Fluree ledger running on `fluree/server` in Closed Mode!

Select from the Profile dropdown box (there should be 4 users to choose from) to see location-relevant shipments appear in the dashboard for that user. 

The Dashboard renders action buttons for shipments that are in particular states:
 - If a shipment is `Pending`, the action is "Ship Out", which will update the shipment to be "In Transit".
 - If a shipment is `In Transit`, the action is "Confirm Receipt", which will update the shipment to be "Delivered".

Finally, there is Policy in the seed data that controls modifications to these shipments. 
  - If a shipment has a `"fromLocation"` that matches the user's `location`, then the user will be allowed to perform the "Ship Out" action. Otherwise, Fluree denies this action.
  - If a shipment has a `"toLocation"` that matches the user's `location`, then the user will be allowed to perform the "Confirm Receipt" action. Otherwise, Fluree denies this action.
  - Policy is also used to determine which shipments the user can see in their dashboard. If you look at the client code, the same query is used for each user, the only difference is who is signing the query (who is "logged in"). Because Fluree knows the identity of the user from the signature and can match it to an identity in the ledger (seeded from the `policy.jsonld` file), the `policy/readShipments` policy is able to filter down the results to just the shipments the user is allowed to see.

## Contributing and Feedback

Contributions are welcome! Please open issues or submit pull requests for improvements. 

Please reach out on Discord if you have any questions:
[Discord Invite](https://discord.gg/KTFy8ZYH)

## License

This project is licensed under the MIT License.