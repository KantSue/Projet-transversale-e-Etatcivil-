
from datetime import datetime

def plus_ancienne(d1, d2):
    return d1.date_depot < d2.date_depot

#decendre le tas
def heapify_min(heap, n, i):
    smallest = i
    left = 2*i + 1
    right = 2*i + 2

    if left < n and plus_ancienne(heap[left], heap[smallest]):
        smallest = left

    if right < n and plus_ancienne(heap[right], heap[smallest]):
        smallest = right

    if smallest != i:
        heap[i], heap[smallest] = heap[smallest], heap[i]
        heapify_min(heap, n, smallest)
        
#construire le tas
def build_min_heap(heap):
    n = len(heap)
    
    for i in range(n//2 - 1, -1, -1):
        heapify_min(heap, n, i)
        

#insertion dans le tas
def insert(heap, element):
    heap.append(element)
    i = len(heap) - 1

    # remonter
    while i > 0:
        parent = (i - 1) // 2

        if plus_ancienne(heap[i], heap[parent]):
            heap[i], heap[parent] = heap[parent], heap[i]
            i = parent
        else:
            break

#extraction/prendre le plus ancien (minimum)
def extract_min(heap):
    if len(heap) == 0:
        return None

    root = heap[0]
    last = heap.pop()

    if len(heap) > 0:
        heap[0] = last
        heapify_min(heap, len(heap), 0)

    return root

#trier par date min depot 
def heap_sort_demandes(demandes):
    build_min_heap(demandes)
    result = []

    while demandes:
        result.append(extract_min(demandes))

    return result
import heapq

def construire_file_priorite(demandes):
    heap = []

    for d in demandes:
        # priorité = date la plus ancienne
        heapq.heappush(heap, (d.date_depot, d))

    return heap


def traiter_demande(heap):
    if not heap:
        return None

    _, demande = heapq.heappop(heap)
    return demande



from django.utils import timezone
from apps.dashboard_app.models import Demande

def generer_num_demande():
    annee = timezone.now().year

    last_demande = Demande.objects.filter(
        num_demande__startswith=f"DEM-{annee}"
    ).order_by('-num_demande').first()

    if last_demande:
        last_num = int(last_demande.num_demande.split('-')[-1])
        new_num = last_num + 1
    else:
        new_num = 1

    return f"DEM-{annee}-{new_num:04d}"