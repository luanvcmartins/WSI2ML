# WSI Annotation Tool

The WSI Annotation Tool is a straightforward annotation software for WSI files. It was built with the goal of simplifying the multidisciplinary effort required to create machine-learning datasets for pathology-related research. 

The software allows you to register users with different roles depending on their permissions, set up projects with images (by providing a folder) and annotation labels, and create and assign users to complete annotation tasks. Once your users have made enough annotations, they can be revised or exported to train ML models. Finally, your annotators can validate your model's annotation and improve the dataset if needed.  

For machine learning applications, the tool has the following workflow in mind:

 - Delegate annotation tasks for users (e.g., pathologists), where they will annotate the images in an easy-to-use user interface. The main goal is to allow non-computer-savvy people, such as pathologists, to easily understand and effectively use the software.

 - Delegate revision tasks for users (e.g., experienced pathologists), so that dubious annotations can be revised, filtered, or improved.

 - Export the annotations made in a non-opinionated way, allowing the ML specialists to deploy whatever tools, programming language, libraries, or techniques they require.

 - Allow the annotation experts to validate the models by allowing them to visualize the model's predictions and improve their annotations.

## Docker
Docker images are available and are likely the easiest way to deploy and use the application. Just clone the repository or download its content, edit the `docker-compose.yml` file to your liking (you may want to mount your WSI directories), and then run docker-compose.
```
git clone https://luanvcmartins@bitbucket.org/luanvcmartins/img-segmentation.git
docker-compose build .
docker-compose up -d
```

By default, we use `PostgreSQL` as the server. If a docker image doesn't exist, it will be automatically created and linked when using the provided `docker-compose.yml`, including with the correct database structure (given by `init-db.sql`).
You may want to customize the `docker-compose.yml` file for your environment; for instance, you may wish to set up your `volumes` to mount your project's folders. You also may find it important to change the default login information of the database.

### First use
Once you deploy the application, you will use the login information `admin` with the password `admin` to login into the system for the first time. We strongly advise you to change the password or delete the user after you complete the first setup process.

1. Go to the `management` section and create a new project: the project's name, WSI folder, and annotation labels will be required. The project's description is optional. 

2. Create a new user to delegate your tasks. The user's name, login and password must be provided. Additionally, users that require additional feature access may receive additional permissions. Annotators need no permissions. 

3. Create your first task: select the files for your task on the list and the users to annotate it. An optional task name can also be provided.

## Thanks
This work was carried out at the Center for Artificial Intelligence (C4AI-USP), with support by the São Paulo Research Foundation (FAPESP grant #2019/07665-4 and #2020/15129-2) and by the IBM Corporation.

## License 
Copyright 2022 luanvcmartins

Licensed under the Apache License, Version 2.0 (the "License");

you may not use this file except in compliance with the License.

You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software

distributed under the License is distributed on an "AS IS" BASIS,

WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

See the License for the specific language governing permissions and

limitations under the License.
