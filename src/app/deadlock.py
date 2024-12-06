class DeadLockDetection():
    def main(self):
        processes = int(input("Enter the no of processes : "))
        resources = int(input("Enter the no of resources : "))
        available = [int(i) for i in input("Enter available resources : ").split()]

        print("\n-- Resources Allocated --")
        currently_allocated = [[int(i) for i in input(f"process {j + 1} : ").split()] for j in range(processes)]

        print("\n-- Resources Requested --")
        request = [[int(i) for i in input(f"process {j + 1} : ").split()] for j in range(processes)]

        allocated = [0] * resources
        for i in range(processes):
            for j in range(resources):
                allocated[j] += currently_allocated[i][j]

        running = [True] * processes
        count = processes
        while count != 0:
            safe = False
            for i in range(processes):
                if running[i]:
                    executing = True
                    for j in range(resources):
                        if request[i][j] > available[j]:
                            executing = False
                            break
                    if executing:
                        running[i] = False
                        count -= 1
                        safe = True
                        for j in range(resources):
                            available[j] += currently_allocated[i][j]
                        break
            if not safe:
                print("\nDeadlock detected")
                break

        if safe:
            print("\nNo deadlock detected")


if __name__ == '__main__':
    d = DeadLockDetection() #instantiating DeadLockDetection as d 
    d.main()
