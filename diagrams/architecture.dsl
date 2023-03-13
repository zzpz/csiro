workspace {

    model {
    
    

        user = person "researcher"    
        system1 = softwareSystem "CSV System"
        system2 = softwareSystem "JSON system"


        archive = softwareSystem "Archival object storage" {
        
        }
        auth = softwareSystem "User authentication"

        app = softwareSystem "FHIR app"{
            interface = container "User Interface"{
                user -> this "uses"
                this -> user "provides query results"
                this -> auth "authenticates + authorizes users"
                auth -> this ""
            }
            
            extract = container "Extract" {
                this -> system1 "Retrieves data"
                this -> system2 "Retreives data"
            }
            transform = container "Transform"{
                extract -> this "provides data"
                technology "My CSIRO Node.js App"
            }
            database = container "Database"{
                description "Stores data for Fulltext search and id loookup"
                technology "SQLlite"
                interface -> this "Queries"
            }
            load = container "Load"{
                description "Loads data to be queried"
                technology ""
                transform -> this "provides data"
            }
            load -> database "Uploads data"
            load -> archive "Stores long term data"
            interface -> database "Queries"
            interface -> archive "Queries"
        }
    }


views {

        systemContext app {
            include *

        }
        
        container app {
            include *
        }
        

        theme default
    }
}